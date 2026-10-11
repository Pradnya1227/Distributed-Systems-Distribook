import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, requireRoles, AuthenticatedRequest } from './middleware/auth';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  allowedHeaders: ['Content-Type', 'X-User-Email']
}));
app.use(express.json());

// Auto-seed resources and users if not present
async function autoSeed() {
  try {
    console.log('Seeding users...');
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

    console.log('Seeding initial college resources...');
    const seedResources = [
      // 20 Classrooms
      { id: '6101CR', name: 'Classroom 6101CR', type: 'Classroom', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6102CR', name: 'Classroom 6102CR', type: 'Classroom', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6103CR', name: 'Classroom 6103CR', type: 'Classroom', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6104CR', name: 'Classroom 6104CR', type: 'Classroom', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6201CR', name: 'Classroom 6201CR', type: 'Classroom', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6202CR', name: 'Classroom 6202CR', type: 'Classroom', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6203CR', name: 'Classroom 6203CR', type: 'Classroom', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6204CR', name: 'Classroom 6204CR', type: 'Classroom', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6301CR', name: 'Classroom 6301CR', type: 'Classroom', building: 'Main Building', floor: 3, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6302CR', name: 'Classroom 6302CR', type: 'Classroom', building: 'Main Building', floor: 3, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6303CR', name: 'Classroom 6303CR', type: 'Classroom', building: 'Main Building', floor: 3, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6304CR', name: 'Classroom 6304CR', type: 'Classroom', building: 'Main Building', floor: 3, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6401CR', name: 'Classroom 6401CR', type: 'Classroom', building: 'Main Building', floor: 4, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6402CR', name: 'Classroom 6402CR', type: 'Classroom', building: 'Main Building', floor: 4, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6403CR', name: 'Classroom 6403CR', type: 'Classroom', building: 'Main Building', floor: 4, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6404CR', name: 'Classroom 6404CR', type: 'Classroom', building: 'Main Building', floor: 4, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '9510CR', name: 'Classroom 9510CR', type: 'Classroom', building: 'Block 9', floor: 5, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '9511CR', name: 'Classroom 9511CR', type: 'Classroom', building: 'Block 9', floor: 5, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '9512CR', name: 'Classroom 9512CR', type: 'Classroom', building: 'Block 9', floor: 5, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '9513CR', name: 'Classroom 9513CR', type: 'Classroom', building: 'Block 9', floor: 5, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },

      // 9 Laboratories
      { id: '6009LA', name: 'Computer Lab 6009LA', type: 'Computer Laboratory', building: 'Main Building', floor: 0, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: true, coordinatorEmail: 'labassistant@pccoepune.org' },
      { id: '6210LA', name: 'Computer Lab 6210LA', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6222LA', name: 'Computer Lab 6222LA', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6230LA', name: 'Computer Lab 6230LA', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6231LA', name: 'Computer Lab 6231LA', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: '6232LA', name: 'Computer Lab 6232LA', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'New CC1 LA', name: 'Computer Lab New CC1 LA', type: 'Computer Laboratory', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'New CC2 LA', name: 'Computer Lab New CC2 LA', type: 'Computer Laboratory', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'New CC3 LA', name: 'Computer Lab New CC3 LA', type: 'Computer Laboratory', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 30, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },

      // 5 Central Facilities
      { id: 'ARCH-HALL', name: 'Architecture Hall', type: 'Seminar Hall', building: 'Architecture Building', floor: 0, department: 'Architecture', capacity: 150, facilities: ['Projector', 'Wi-Fi', 'PA System'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'SEM-HALL-01', name: 'Seminar Hall 01', type: 'Seminar Hall', building: 'Main Building', floor: 1, department: 'Common', capacity: 200, facilities: ['Projector', 'Wi-Fi', 'AC', 'PA System'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'SEM-HALL-02', name: 'Seminar Hall 02', type: 'Seminar Hall', building: 'Main Building', floor: 1, department: 'Common', capacity: 100, facilities: ['Projector', 'Wi-Fi', 'AC', 'PA System'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'READ-HALL', name: 'Common Reading Hall', type: 'Reading Hall', building: 'Main Building', floor: 0, department: 'Common', capacity: 120, facilities: ['Wi-Fi', 'Silent Zone'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'AUDITORIUM', name: 'Auditorium', type: 'Auditorium', building: 'Main Building', floor: 0, department: 'Common', capacity: 500, facilities: ['AC', 'Stage', 'Lighting', 'PA System'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },

      // 4 Controlled Halls
      { id: 'ARCH-SH-101', name: 'Architecture Seminar Hall', type: 'Seminar Hall', building: 'Architecture Building', floor: 1, department: 'Architecture', capacity: 150, facilities: ['Projector', 'Wi-Fi', 'Acoustics'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'MECH-SH-201', name: 'Mechanical Seminar Hall', type: 'Seminar Hall', building: 'Mechanical Building', floor: 2, department: 'Mechanical', capacity: 120, facilities: ['Projector', 'Wi-Fi', 'Sound System'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'COMP-SH-301', name: 'Computer Engineering Seminar Hall', type: 'Seminar Hall', building: 'Main Building', floor: 3, department: 'Computer Engineering', capacity: 120, facilities: ['Projector', 'Wi-Fi', 'AC'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },
      { id: 'LIB-RH-01', name: 'Central Reading Hall', type: 'Reading Hall', building: 'Library Building', floor: 1, department: 'Common', capacity: 150, facilities: ['Wi-Fi', 'AC', 'Power Outlets'], status: 'active', requiresApproval: true, coordinatorEmail: 'coordinator@pccoepune.org' },

      // 6 Additional Resources
      { id: 'COMP-LAB-203', name: 'Computer Lab 203', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 60, facilities: ['Computers', 'Projector', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'COMP-LAB-204', name: 'Computer Lab 204', type: 'Computer Laboratory', building: 'Main Building', floor: 2, department: 'Computer Engineering', capacity: 60, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'COMP-LAB-G01', name: 'Computer Lab G01', type: 'Computer Laboratory', building: 'Main Building', floor: 0, department: 'Common', capacity: 50, facilities: ['Computers', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'ENTC-LAB-G01', name: 'ENTC Lab G01', type: 'ENTC Laboratory', building: 'Main Building', floor: 0, department: 'Common', capacity: 40, facilities: ['Oscilloscopes', 'Wi-Fi'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'GD-ROOM-01', name: 'GD Room 01', type: 'GD Room', building: 'Main Building', floor: 0, department: 'Common', capacity: 12, facilities: ['Whiteboard'], status: 'active', requiresApproval: false, coordinatorEmail: null },
      { id: 'TEST-LOCK-ROOM-01', name: 'Temporary Lock Test Room', type: 'Classroom', building: 'Main Building', floor: 1, department: 'Computer Engineering', capacity: 60, facilities: ['Projector', 'Wi-Fi'], status: 'inactive', requiresApproval: false, coordinatorEmail: null }
    ];

    for (const r of seedResources) {
      await prisma.resource.upsert({
        where: { id: r.id },
        update: r,
        create: r
      });
    }
    console.log('User and Resource auto-seed completed successfully.');
  } catch (error) {
    console.error('Failed to auto-seed resources:', error);
  }
}

// Global Auth Middleware for all endpoints
app.use(authMiddleware);

// Get all resources
app.get('/resources', async (req: AuthenticatedRequest, res) => {
  try {
    const list = await prisma.resource.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search resources
app.get('/resources/search', async (req: AuthenticatedRequest, res) => {
  try {
    const { type, building, department, capacity } = req.query;
    const filters: any = {};
    if (type && type !== 'Any') filters.type = type as string;
    if (building && building !== 'Any') filters.building = building as string;
    if (department && department !== 'Any') filters.department = department as string;
    if (capacity) filters.capacity = { gte: parseInt(capacity as string) || 0 };

    const matched = await prisma.resource.findMany({
      where: filters,
      orderBy: { id: 'asc' }
    });
    res.json(matched);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific resource
app.get('/resources/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const item = await prisma.resource.findUnique({
      where: { id: req.params.id }
    });
    if (!item) {
      return res.status(404).json({ error: 'Resource not found' });
    }
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add new resource (Admin Only)
app.post('/resources', requireRoles(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { id, name, type, building, floor, department, capacity, facilities, status, requiresApproval, coordinatorEmail } = req.body;
    
    if (!id || !name || !type) {
      return res.status(400).json({ error: 'Missing required fields (id, name, type)' });
    }

    const existing = await prisma.resource.findUnique({ where: { id } });
    if (existing) {
      return res.status(409).json({ error: 'Resource with this ID already exists' });
    }

    const created = await prisma.resource.create({
      data: {
        id,
        name,
        type,
        building: building || 'Main Building',
        floor: typeof floor === 'number' ? floor : parseInt(floor || '1') || 1,
        department: department || 'Common',
        capacity: typeof capacity === 'number' ? capacity : parseInt(capacity || '30') || 30,
        facilities: Array.isArray(facilities) ? facilities : (facilities ? facilities.split(',').map((f: string) => f.trim()) : []),
        status: status || 'active',
        requiresApproval: !!requiresApproval,
        coordinatorEmail: coordinatorEmail || null
      }
    });

    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update resource (Admin Only)
app.put('/resources/:id', requireRoles(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const { name, type, building, floor, department, capacity, facilities, status, requiresApproval, coordinatorEmail } = req.body;
    
    const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    const updated = await prisma.resource.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name : existing.name,
        type: type !== undefined ? type : existing.type,
        building: building !== undefined ? building : existing.building,
        floor: floor !== undefined ? (typeof floor === 'number' ? floor : parseInt(floor) || 1) : existing.floor,
        department: department !== undefined ? department : existing.department,
        capacity: capacity !== undefined ? (typeof capacity === 'number' ? capacity : parseInt(capacity) || 30) : existing.capacity,
        facilities: facilities !== undefined ? (Array.isArray(facilities) ? facilities : facilities.split(',').map((f: string) => f.trim())) : existing.facilities,
        status: status !== undefined ? status : existing.status,
        requiresApproval: requiresApproval !== undefined ? !!requiresApproval : existing.requiresApproval,
        coordinatorEmail: coordinatorEmail !== undefined ? (coordinatorEmail || null) : existing.coordinatorEmail
      }
    });

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete resource (Admin Only)
app.delete('/resources/:id', requireRoles(['ADMIN']), async (req: AuthenticatedRequest, res) => {
  try {
    const existing = await prisma.resource.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await prisma.resource.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Resource deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, async () => {
  console.log(`Resource Service running on port ${PORT}`);
  await autoSeed();
});
