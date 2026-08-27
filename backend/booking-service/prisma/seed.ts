import { PrismaClient, BookingStatus } from '@prisma/client';

const prisma = new PrismaClient();

const resourceIds = [
  "9510CR",
  "6204CR",
  "6202CR",
  "6009LA",
  "6210LA",
  "New CC1 LA",
  "6222LA",
  "New CC2 LA",
  "6218LA",
  "6103CR",
  "9412CR",
  "6208LA",
  "6118LA",
  "6104LA",
  "6107LA",
  "6201CR",
  "6010LA",
  "6216LA",
  "6004DL",
  "New CC3 LA",
  "6120LA",
  "6102CR",
  "6105LA",
  "6221LA",
  "6209LA",
  "6211LA",
  "6119LA",
  "6206LA",
  "0106CR",
  "6416CR",
  "9102LA",
  "9306CR",
  "COMP-LAB-203",
  "COMP-LAB-204",
  "TEST-LOCK-ROOM-01"
];

async function main() {
  console.log("Seeding BookingLock entries...");
  await prisma.bookingLock.deleteMany({});
  await prisma.booking.deleteMany({});
  
  for (const id of resourceIds) {
    await prisma.bookingLock.create({
      data: { resourceId: id }
    });
  }
  
  // Seed initial booking for first resource
  if (resourceIds.length > 0) {
    const firstLab = resourceIds.find(id => id.includes('LA')) || resourceIds[0];
    await prisma.booking.create({
      data: {
        id: "BK-2026-00099",
        resourceId: firstLab,
        userId: "student@demo.com",
        userName: "Demo Student",
        date: "2026-08-24",
        startTime: "12:00",
        endTime: "14:00",
        participants: 45,
        purpose: "Workshop",
        status: BookingStatus.APPROVED
      }
    });
  }

  console.log("Booking seeder completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
