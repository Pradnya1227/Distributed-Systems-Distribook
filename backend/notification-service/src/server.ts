import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthenticatedRequest } from './middleware/auth';
import { startNotificationConsumer, getLamportClock, resetLamportClock } from './consumers/bookingEvents.consumer';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  allowedHeaders: ['Content-Type', 'X-User-Email']
}));
app.use(express.json());

// Start consuming events
startNotificationConsumer();

// Public Health Endpoint (Beacon / Monitoring)
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    service: 'notification-service',
    lamportClock: getLamportClock(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Public Lamport Clock Status (Distributed Systems Verification)
app.get('/lamport', (req, res) => {
  res.json({
    service: 'notification-service',
    lamportClock: getLamportClock()
  });
});

app.use(authMiddleware);

// GET /notifications/user/:userId: Fetch user notifications
app.get('/notifications/user/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.userId;
    // Security check: user can only see their own notifications unless Admin/Coordinator
    const user = req.user!;
    if (user.role === 'STUDENT' && user.email !== userId) {
      return res.status(403).json({ error: 'Forbidden. Access restricted.' });
    }

    const list = await prisma.notification.findMany({
      where: { userEmail: userId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /notifications/unread-count/:userId: Fetch unread count
app.get('/notifications/unread-count/:userId', async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.params.userId;
    const user = req.user!;
    if (user.role === 'STUDENT' && user.email !== userId) {
      return res.status(403).json({ error: 'Forbidden. Access restricted.' });
    }

    const count = await prisma.notification.count({
      where: { userEmail: userId, status: 'UNREAD' }
    });
    res.json({ count });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// PATCH /notifications/:id/read: Mark single notification read
app.patch('/notifications/:id/read', async (req: AuthenticatedRequest, res) => {
  try {
    const id = req.params.id;
    const existing = await prisma.notification.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Notification not found' });

    const updated = await prisma.notification.update({
      where: { id },
      data: { status: 'READ' }
    });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function autoSeed() {
  try {
    console.log('Seeding users in Notification Service...');
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
    console.log('Notification Service user auto-seed completed.');
  } catch (error) {
    console.error('Failed to auto-seed users in Notification Service:', error);
  }
}

app.listen(PORT, async () => {
  console.log(`Notification Service running on port ${PORT}`);
  await autoSeed();
});
