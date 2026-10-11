import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import PDFDocument from 'pdfkit';
import { authMiddleware, requireRoles, AuthenticatedRequest } from './middleware/auth';
import { connectRabbitMQ, publishBookingEvent } from './messaging/rabbitmq';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  allowedHeaders: ['Content-Type', 'X-User-Email']
}));
app.use(express.json());

// Initialize RabbitMQ connection
connectRabbitMQ();

// Helper: Convert time string "HH:MM" to minutes from midnight
function toMin(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Check if two time ranges overlap
function overlaps(s1: number, e1: number, s2: number, e2: number): boolean {
  return s1 < e2 && e1 > s2;
}

// Helper: Check if dates overlap
function datesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 <= end2 && end1 >= start2;
}

// Helper: Get day name from date string
function getDayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()].toUpperCase();
}

// Helper: Get all dates between range
function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates = [];
  let curr = new Date(startDate + 'T00:00:00');
  const last = new Date(endDate + 'T00:00:00');
  while (curr <= last) {
    dates.push(curr.toISOString().split('T')[0]);
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
}

// Helper: Call Resource Service to get resource details
async function fetchResource(resourceId: string, userEmail: string) {
  const resourceUrl = process.env.RESOURCE_SERVICE_URL || 'http://localhost:3001';
  try {
    const response = await fetch(`${resourceUrl}/resources/${resourceId}`, {
      headers: { 'X-User-Email': userEmail }
    });
    if (response.status === 404) return null;
    if (!response.ok) throw new Error(`Resource Service error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching resource details:', error);
    return null;
  }
}

// Helper: Call Timetable Service to check for course overlaps
async function fetchTimetableEntries(userEmail: string) {
  const timetableUrl = process.env.TIMETABLE_SERVICE_URL || 'http://localhost:3002';
  try {
    const response = await fetch(`${timetableUrl}/timetables`, {
      headers: { 'X-User-Email': userEmail }
    });
    if (!response.ok) throw new Error(`Timetable Service error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    return [];
  }
}

// Public Health Endpoint (Beacon / Monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'booking-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use(authMiddleware);

// GET /bookings: Fetch list of bookings
app.get('/bookings', async (req: AuthenticatedRequest, res) => {
  try {
    const { userId } = req.query;
    const user = req.user!;

    let bookings;
    if (user.role === 'STUDENT') {
      bookings = await prisma.booking.findMany({
        where: { userEmail: user.email },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      bookings = await prisma.booking.findMany({
        orderBy: { createdAt: 'desc' }
      });
    }
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /bookings/:id: Fetch specific booking
app.get('/bookings/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const b = await prisma.booking.findUnique({
      where: { id: req.params.id }
    });
    if (!b) return res.status(404).json({ error: 'Booking not found' });
    res.json(b);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /bookings: Create a booking
app.post('/bookings', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const {
      resourceId,
      date,
      startTime,
      endTime,
      participants,
      purpose,
      startDate,
      endDate,
      eventName,
      facultyEmail
    } = req.body;

    if (!resourceId || !startTime || !endTime || !purpose) {
      return res.status(400).json({ error: 'Missing required booking fields.' });
    }

    const bDate = date || startDate;
    const bStartDate = startDate || date;
    const bEndDate = endDate || date;

    if (!bDate || !bStartDate || !bEndDate) {
      return res.status(400).json({ error: 'Missing required date fields.' });
    }

    // 1. Fetch resource details
    const resource = await fetchResource(resourceId, user.email);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    if (resource.status !== 'active') {
      return res.status(400).json({ error: 'Resource is inactive and cannot be booked.' });
    }

    // 2. Concurrency check and transaction block
    const result = await prisma.$transaction(async (tx) => {
      // Locking row for resource
      await tx.$executeRawUnsafe(
        `INSERT INTO "BookingLock" ("resourceId", "createdAt", "updatedAt") 
         VALUES ($1, NOW(), NOW()) 
         ON CONFLICT ("resourceId") DO UPDATE SET "updatedAt" = NOW()`,
        resourceId
      );
      await tx.$queryRawUnsafe(
        `SELECT * FROM "BookingLock" WHERE "resourceId" = $1 FOR UPDATE`,
        resourceId
      );

      // Check overlapping maintenance blocks
      const maints = await tx.maintenanceBlock.findMany({
        where: { resourceId }
      });
      for (const m of maints) {
        if (datesOverlap(bStartDate, bEndDate, m.startDate, m.endDate) &&
            overlaps(toMin(startTime), toMin(endTime), toMin(m.startTime), toMin(m.endTime))) {
          throw new Error('Conflict: overlaps with a scheduled maintenance block.');
        }
      }

      // Check overlapping bookings
      const existing = await tx.booking.findMany({
        where: {
          resourceId,
          status: { in: ['pending', 'confirmed', 'approved'] }
        }
      });
      for (const b of existing) {
        const esd = b.startDate || b.date;
        const eed = b.endDate || b.date;
        if (datesOverlap(bStartDate, bEndDate, esd, eed) &&
            overlaps(toMin(startTime), toMin(endTime), toMin(b.startTime), toMin(b.endTime))) {
          throw new Error(`Time conflict: overlaps with existing booking (${b.startTime}–${b.endTime}).`);
        }
      }

      // Check academic class timetable conflicts
      const ttEntries = await fetchTimetableEntries(user.email);
      const bookingDates = getDatesInRange(bStartDate, bEndDate);
      for (const dStr of bookingDates) {
        const dayOfWeek = getDayName(dStr);
        const conflicts = ttEntries.filter((tte: any) => tte.resourceId === resourceId && tte.dayOfWeek === dayOfWeek);
        for (const tte of conflicts) {
          if (overlaps(toMin(startTime), toMin(endTime), toMin(tte.startTime), toMin(tte.endTime))) {
            throw new Error(`Time conflict: overlaps with academic class timetable (${tte.subject} ${tte.startTime}–${tte.endTime}).`);
          }
        }
      }

      // Calculate workflow status
      let initialStatus = 'confirmed';
      let fApp = true;
      let cApp = true;
      let lApp = true;

      const isControlled = resource.requiresApproval;
      const isMultiDay = startDate && endDate && startDate !== endDate;
      const isLab = resource.type.toLowerCase().includes('lab') || resource.type.toLowerCase().includes('laboratory');

      if (isControlled || isMultiDay) {
        initialStatus = 'pending';
        // Faculty request route
        if (facultyEmail) {
          fApp = user.role === 'FACULTY';
        } else {
          fApp = true;
        }

        if (isLab) {
          lApp = false;
          cApp = true;
        } else {
          cApp = false;
          lApp = true;
        }
      }

      // Create Booking
      const booking = await tx.booking.create({
        data: {
          resourceId,
          userId: user.email,
          userEmail: user.email,
          userName: user.name,
          date: bDate,
          startDate: startDate || null,
          endDate: endDate || null,
          startTime,
          endTime,
          participants: participants || 1,
          purpose,
          eventName: eventName || null,
          facultyEmail: facultyEmail || null,
          status: initialStatus,
          facultyApproved: fApp,
          coordinatorApproved: cApp,
          labAssistantApproved: lApp
        }
      });

      // Write History
      await tx.bookingHistory.create({
        data: {
          bookingId: booking.id,
          action: 'BOOKING_CREATED',
          actor: user.email,
          actorRole: user.role,
          newStatus: initialStatus
        }
      });

      return booking;
    });

    // Publish creation event
    await publishBookingEvent('BOOKING_CREATED', result);

    res.status(201).json(result);
  } catch (error: any) {
    if (error.message.includes('Conflict') || error.message.includes('conflict')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// POST /bookings/:id/approve: Approve booking request
app.post('/bookings/:id/approve', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const id = req.params.id;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.userEmail === user.email) {
      return res.status(403).json({ error: 'Forbidden. You cannot approve your own booking request.' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending state.' });
    }

    const resource = await fetchResource(booking.resourceId, user.email);
    const isLab = resource?.type.toLowerCase().includes('lab') || resource?.type.toLowerCase().includes('laboratory');

    let updatedFApp = booking.facultyApproved;
    let updatedCApp = booking.coordinatorApproved;
    let updatedLApp = booking.labAssistantApproved;

    let action = '';

    if (user.role === 'ADMIN') {
      updatedFApp = true;
      updatedCApp = true;
      updatedLApp = true;
      action = 'ADMIN_APPROVED';
    } else if (user.role === 'FACULTY') {
      if (booking.facultyEmail !== user.email) {
        return res.status(403).json({ error: 'Forbidden. You are not the assigned faculty member.' });
      }
      updatedFApp = true;
      action = 'BOOKING_FACULTY_APPROVED';
    } else if (user.role === 'HALL_COORDINATOR') {
      if (isLab) {
        return res.status(403).json({ error: 'Forbidden. Hall Coordinators cannot approve laboratory resources.' });
      }
      if (booking.facultyEmail && !booking.facultyApproved) {
        return res.status(400).json({ error: 'Booking requires Faculty approval first.' });
      }
      updatedCApp = true;
      action = 'BOOKING_COORDINATOR_APPROVED';
    } else if (user.role === 'LAB_ASSISTANT') {
      if (!isLab) {
        return res.status(403).json({ error: 'Forbidden. Lab Assistants cannot approve hall resources.' });
      }
      if (booking.facultyEmail && !booking.facultyApproved) {
        return res.status(400).json({ error: 'Booking requires Faculty approval first.' });
      }
      updatedLApp = true;
      action = 'BOOKING_LAB_APPROVED';
    } else {
      return res.status(403).json({ error: 'Forbidden. Students cannot approve bookings.' });
    }

    const fullyApproved = updatedFApp && updatedCApp && updatedLApp;
    const finalStatus = fullyApproved ? 'confirmed' : 'pending';

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        facultyApproved: updatedFApp,
        coordinatorApproved: updatedCApp,
        labAssistantApproved: updatedLApp,
        status: finalStatus
      }
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: id,
        action,
        actor: user.email,
        actorRole: user.role,
        previousStatus: booking.status,
        newStatus: finalStatus
      }
    });

    await publishBookingEvent(action, updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /bookings/:id/reject: Reject booking request
app.post('/bookings/:id/reject', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const id = req.params.id;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    if (booking.status !== 'pending') {
      return res.status(400).json({ error: 'Booking is not in pending state.' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason || 'Rejected by administrator'
      }
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: id,
        action: 'BOOKING_REJECTED',
        actor: user.email,
        actorRole: user.role,
        previousStatus: booking.status,
        newStatus: 'rejected',
        reason: reason || 'Rejected'
      }
    });

    await publishBookingEvent('BOOKING_REJECTED', updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /bookings/:id/cancel: Cancel booking
app.post('/bookings/:id/cancel', async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const id = req.params.id;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Validate cancellation permissions
    const isOwner = booking.userEmail === user.email;
    const isAdmin = user.role === 'ADMIN';
    const resource = await fetchResource(booking.resourceId, user.email);
    const isLab = resource?.type.toLowerCase().includes('lab') || resource?.type.toLowerCase().includes('laboratory');
    
    const isCoordCancel = user.role === 'HALL_COORDINATOR' && !isLab;
    const isLabAsstCancel = user.role === 'LAB_ASSISTANT' && isLab;

    if (!isOwner && !isAdmin && !isCoordCancel && !isLabAsstCancel) {
      return res.status(403).json({ error: 'Forbidden. You are not authorized to cancel this booking.' });
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledBy: user.email,
        cancelledAt: new Date(),
        cancellationReason: reason || 'Cancelled by requester'
      }
    });

    await prisma.bookingHistory.create({
      data: {
        bookingId: id,
        action: 'BOOKING_CANCELLED',
        actor: user.email,
        actorRole: user.role,
        previousStatus: booking.status,
        newStatus: 'cancelled',
        reason: reason || 'Cancelled'
      }
    });

    await publishBookingEvent('BOOKING_CANCELLED', updated);

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /bookings/:id/pdf: Generate confirmation PDF
app.get('/bookings/:id/pdf', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id;
    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const resource = await fetchResource(booking.resourceId, req.user!.email);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Booking_Confirmation_${id}.pdf`);

    doc.pipe(res);

    // Header
    doc.fontSize(22).fillColor('#10b981').text('DistriBook Confirmation', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#6b7280').text('Distributed Classroom & Lab Booking System', { align: 'center' });
    doc.moveDown(1.5);

    // Divider
    doc.moveTo(50, 110).lineTo(562, 110).strokeColor('#e5e7eb').stroke();
    doc.moveDown(1.5);

    // Title details
    doc.fontSize(14).fillColor('#111827').text(`Booking Reference: ${booking.id}`, { underline: true });
    doc.moveDown(1.0);

    const formatRow = (label: string, val: string) => {
      doc.fontSize(11).fillColor('#4b5563').text(label, { width: 150, continued: true });
      doc.fillColor('#111827').text(`: ${val}`);
      doc.moveDown(0.5);
    };

    formatRow('Resource ID', booking.resourceId);
    formatRow('Resource Name', resource?.name || 'N/A');
    formatRow('Building', resource?.building || 'Main Building');
    formatRow('Date / Date Range', (booking.startDate && booking.endDate) ? `${booking.startDate} to ${booking.endDate}` : booking.date);
    formatRow('Start Time', booking.startTime);
    formatRow('End Time', booking.endTime);
    formatRow('Event Name', booking.eventName || 'N/A');
    formatRow('Booking Purpose', booking.purpose);
    formatRow('ParticipantsCount', String(booking.participants));
    formatRow('Faculty In-charge', booking.facultyEmail || 'None');
    formatRow('Booking Status', booking.status.toUpperCase());
    formatRow('Approval Information', `Faculty: ${booking.facultyApproved ? 'Approved' : 'Pending/Not Required'}, Coordinator: ${booking.coordinatorApproved ? 'Approved' : 'Pending/Not Required'}, Lab Assistant: ${booking.labAssistantApproved ? 'Approved' : 'Pending/Not Required'}`);

    doc.moveDown(2);
    doc.fontSize(9).fillColor('#9ca3af').text(`Receipt generated automatically on: ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /maintenance: Fetch maintenance slots
app.get('/maintenance', async (req: AuthenticatedRequest, res) => {
  try {
    const blocks = await prisma.maintenanceBlock.findMany({});
    res.json(blocks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /maintenance: Create maintenance slot (Admin Only)
app.post('/maintenance', requireRoles(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { resourceId, startDate, endDate, startTime, endTime, reason } = req.body;
    if (!resourceId || !startDate || !endDate || !startTime || !endTime || !reason) {
      return res.status(400).json({ error: 'Missing required maintenance block fields.' });
    }

    const block = await prisma.maintenanceBlock.create({
      data: {
        resourceId,
        startDate,
        endDate,
        startTime,
        endTime,
        reason,
        createdBy: req.user!.email
      }
    });

    res.status(201).json(block);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /maintenance/:id: Delete maintenance slot (Admin Only)
app.delete('/maintenance/:id', requireRoles(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id;
    const existing = await prisma.maintenanceBlock.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Maintenance block not found' });

    await prisma.maintenanceBlock.delete({ where: { id } });
    res.json({ message: 'Blocked slot removed successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function autoSeed() {
  try {
    console.log('Seeding users in Booking Service...');
    const seedUsers = [
      { email: 'pradnya.wakode23@pccoepune.org', name: 'Pradnya Wakode', role: 'student' },
      { email: 'shreeya.patil23@pccoepune.org', name: 'Shreeya Patil', role: 'student' },
      { email: 'faculty@pccoepune.org', name: 'Faculty Member', role: 'faculty' },
      { email: 'coordinator@pccoepune.org', name: 'Hall Coordinator', role: 'coordinator' },
      { email: 'labassistant@pccoepune.org', name: 'Lab Assistant', role: 'labassistant' },
      { email: 'admin@pccoepune.org', name: 'System Admin', role: 'admin' },
      { email: 'student@demo.com', name: 'Demo Student', role: 'student' },
      { email: 'student1@demo.com', name: 'Demo Student 1', role: 'student' },
      { email: 'student2@demo.com', name: 'Demo Student 2', role: 'student' },
      { email: 'admin@demo.com', name: 'Demo Admin', role: 'admin' }
    ];
    for (const u of seedUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: u,
        create: u
      });
    }

    console.log('Seeding BookingLock entries...');
    const resourceIds = [
      // Classrooms
      '6101CR', '6102CR', '6103CR', '6104CR',
      '6201CR', '6202CR', '6203CR', '6204CR',
      '6301CR', '6302CR', '6303CR', '6304CR',
      '6401CR', '6402CR', '6403CR', '6404CR',
      '9510CR', '9511CR', '9512CR', '9513CR',
      // Labs
      '6009LA', '6210LA', '6222LA', '6230LA', '6231LA', '6232LA',
      'New CC1 LA', 'New CC2 LA', 'New CC3 LA',
      // Central Facilities
      'ARCH-HALL', 'SEM-HALL-01', 'SEM-HALL-02', 'READ-HALL', 'AUDITORIUM',
      // Controlled Halls
      'ARCH-SH-101', 'MECH-SH-201', 'COMP-SH-301', 'LIB-RH-01',
      // Additional
      'COMP-LAB-203', 'COMP-LAB-204', 'COMP-LAB-G01', 'ENTC-LAB-G01', 'GD-ROOM-01', 'TEST-LOCK-ROOM-01'
    ];

    for (const rId of resourceIds) {
      await prisma.bookingLock.upsert({
        where: { resourceId: rId },
        update: {},
        create: { resourceId: rId }
      });
    }
    console.log('Booking Service auto-seed completed successfully.');
  } catch (error) {
    console.error('Failed to auto-seed Booking locks:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Booking Service running on port ${PORT}`);
  await autoSeed();
});
