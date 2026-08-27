import express from 'express';
import cors from 'cors';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { PrismaClient, DayOfWeek } from '@prisma/client';
import { authMiddleware, requireRoles, AuthenticatedRequest } from './middleware/auth';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3002;
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  allowedHeaders: ['Content-Type', 'X-User-Email']
}));
app.use(express.json());

// Auto-seed initial timetable and users
async function autoSeed() {
  try {
    console.log('Seeding users in Timetable Service...');
    const seedUsers = [
      { email: 'pradnya.wakode23@pccoepune.org', name: 'Pradnya Wakode', role: 'student' },
      { email: 'shreeya.patil23@pccoepune.org', name: 'Shreeya Patil', role: 'student' },
      { email: 'faculty@pccoepune.org', name: 'Faculty Member', role: 'faculty' },
      { email: 'coordinator@pccoepune.org', name: 'Hall Coordinator', role: 'coordinator' },
      { email: 'labassistant@pccoepune.org', name: 'Lab Assistant', role: 'labassistant' },
      { email: 'admin@pccoepune.org', name: 'System Admin', role: 'admin' }
    ];
    for (const u of seedUsers) {
      await prisma.user.upsert({
        where: { email: u.email },
        update: u,
        create: u
      });
    }

    const count = await prisma.timetableEntry.count();
    if (count > 0) {
      console.log('Database already has timetable entries. Skipping timetable auto-seed.');
      return;
    }
    console.log('Seeding initial timetable entries...');
    const seedTimetable = [
      { resourceId: 'COMP-LAB-203', dayOfWeek: DayOfWeek.MONDAY, startTime: '10:00', endTime: '11:00', subject: 'Data Structures', department: 'Computer Engineering', facultyName: 'Faculty', semester: 'III', division: 'A' },
      { resourceId: 'COMP-LAB-203', dayOfWeek: DayOfWeek.MONDAY, startTime: '11:00', endTime: '12:00', subject: 'DBMS', department: 'Computer Engineering', facultyName: 'Faculty', semester: 'III', division: 'A' },
      { resourceId: 'COMP-LAB-203', dayOfWeek: DayOfWeek.MONDAY, startTime: '14:00', endTime: '16:00', subject: 'Operating Systems', department: 'Computer Engineering', facultyName: 'Faculty', semester: 'III', division: 'A' },
      { resourceId: 'COMP-LAB-204', dayOfWeek: DayOfWeek.MONDAY, startTime: '09:00', endTime: '13:00', subject: 'Networks Lab', department: 'Computer Engineering', facultyName: 'Faculty', semester: 'III', division: 'A' }
    ];

    for (const entry of seedTimetable) {
      await prisma.timetableEntry.create({ data: entry });
    }
    console.log('Timetable and user auto-seed completed successfully.');
  } catch (error) {
    console.error('Failed to auto-seed timetable:', error);
  }
}

// Global Auth Middleware
app.use(authMiddleware);

// Get all timetables
app.get('/timetables', async (req: AuthenticatedRequest, res) => {
  try {
    const list = await prisma.timetableEntry.findMany({});
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Helper: Convert time string "HH:MM" to minutes from midnight
function toMin(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

// Helper: Convert openpyxl/excel time formats
function parseExcelTime(val: any): string {
  if (!val) return '00:00';
  let str = String(val).trim();
  
  // Handle decimal representation from Excel time cells (e.g. 0.41666 -> 10:00)
  if (!isNaN(Number(str)) && Number(str) > 0 && Number(str) < 1) {
    const totalMinutes = Math.round(Number(str) * 24 * 60);
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // AM/PM conversion
  if (/AM|PM/i.test(str)) {
    const match = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (match) {
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && h !== 12) h += 12;
      else if (ampm === 'AM' && h === 12) h = 0;
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  const matchSimple = str.match(/(\d+):(\d+)/);
  if (matchSimple) {
    const h = parseInt(matchSimple[1]);
    const m = parseInt(matchSimple[2]);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  return str;
}

// Timetable Import Preview (Admin Only)
app.post('/timetables/import/preview', requireRoles(['ADMIN']), upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

    // Filter out rows and skip headers (row 0 is headers)
    const dataRows = rawData.slice(1).filter(row => row.some(val => val !== null && val !== undefined && val !== ''));
    
    const dayMap: Record<string, DayOfWeek> = {
      'monday': DayOfWeek.MONDAY,
      'tuesday': DayOfWeek.TUESDAY,
      'wednesday': DayOfWeek.WEDNESDAY,
      'thursday': DayOfWeek.THURSDAY,
      'friday': DayOfWeek.FRIDAY,
      'saturday': DayOfWeek.SATURDAY,
      'sunday': DayOfWeek.SUNDAY
    };

    const existingEntries = await prisma.timetableEntry.findMany({});
    const previewRows = [];

    for (const row of dataRows) {
      const resourceId = String(row[0] || '').trim();
      const dayStr = String(row[1] || '').trim().toLowerCase();
      const start = parseExcelTime(row[2]);
      const end = parseExcelTime(row[3]);
      const subject = String(row[4] || '').trim();
      const department = String(row[5] || '').trim();
      const facultyName = row[6] ? String(row[6]).trim() : null;
      const semester = row[7] ? String(row[7]).trim() : null;
      const division = row[8] ? String(row[8]).trim() : null;

      if (!resourceId || !dayStr || !start || !end) {
        continue;
      }

      const errors: string[] = [];
      const conflicts: string[] = [];

      const dayOfWeek = dayMap[dayStr];
      if (!dayOfWeek) {
        errors.push(`Invalid day of week: ${dayStr}`);
      }

      // Check overlap with other rows inside the spreadsheet or DB
      const hasDbConflict = existingEntries.some(db => {
        if (db.resourceId !== resourceId || db.dayOfWeek !== dayOfWeek) return false;
        return toMin(start) < toMin(db.endTime) && toMin(end) > toMin(db.startTime);
      });

      if (hasDbConflict) {
        conflicts.push(`Conflict: overlap in resource schedule for ${resourceId} on ${dayOfWeek}`);
      }

      previewRows.push({
        data: {
          resourceId,
          day: dayOfWeek || 'MONDAY',
          start,
          end,
          subject,
          department,
          facultyName,
          semester,
          division
        },
        status: errors.length > 0 ? 'invalid' : 'valid',
        errors,
        conflicts
      });
    }

    const previewRecord = await prisma.timetableImportPreview.create({
      data: {
        data: previewRows as any
      }
    });

    res.json({
      previewId: previewRecord.id,
      rows: previewRows
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Timetable Import Confirm (Admin Only)
app.post('/timetables/import/confirm', requireRoles(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { previewId } = req.body;
    if (!previewId) {
      return res.status(400).json({ error: 'Missing previewId' });
    }

    const preview = await prisma.timetableImportPreview.findUnique({
      where: { id: previewId }
    });

    if (!preview) {
      return res.status(404).json({ error: 'Preview session not found' });
    }

    const rows = preview.data as any[];
    let count = 0;

    for (const row of rows) {
      if (row.status === 'valid' && row.conflicts.length === 0) {
        await prisma.timetableEntry.create({
          data: {
            resourceId: row.data.resourceId,
            dayOfWeek: row.data.day as DayOfWeek,
            startTime: row.data.start,
            endTime: row.data.end,
            subject: row.data.subject,
            department: row.data.department,
            facultyName: row.data.facultyName,
            semester: row.data.semester,
            division: row.data.division
          }
        });
        count++;
      }
    }

    // Clear preview record
    await prisma.timetableImportPreview.delete({ where: { id: previewId } });

    res.json({ success: true, count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Timetable Service running on port ${PORT}`);
  await autoSeed();
});
