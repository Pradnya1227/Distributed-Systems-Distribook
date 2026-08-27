import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const resources = [
  {
    "id": "9510CR",
    "name": "Classroom 9510CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 9,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6204CR",
    "name": "Classroom 6204CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6202CR",
    "name": "Classroom 6202CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6009LA",
    "name": "Computer Lab 6009LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6210LA",
    "name": "Computer Lab 6210LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "New CC1 LA",
    "name": "Computer Lab New CC1 LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 1,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6222LA",
    "name": "Computer Lab 6222LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "New CC2 LA",
    "name": "Computer Lab New CC2 LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 2,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6218LA",
    "name": "Computer Lab 6218LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6103CR",
    "name": "Classroom 6103CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "9412CR",
    "name": "Classroom 9412CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 9,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6208LA",
    "name": "Computer Lab 6208LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6118LA",
    "name": "Computer Lab 6118LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6104LA",
    "name": "Computer Lab 6104LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6107LA",
    "name": "Computer Lab 6107LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6201CR",
    "name": "Classroom 6201CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6010LA",
    "name": "Computer Lab 6010LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6216LA",
    "name": "Computer Lab 6216LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6004DL",
    "name": "Computer Lab 6004DL",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "New CC3 LA",
    "name": "Computer Lab New CC3 LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 3,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6120LA",
    "name": "Computer Lab 6120LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6102CR",
    "name": "Classroom 6102CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6105LA",
    "name": "Computer Lab 6105LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6221LA",
    "name": "Computer Lab 6221LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6209LA",
    "name": "Computer Lab 6209LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6211LA",
    "name": "Computer Lab 6211LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6119LA",
    "name": "Computer Lab 6119LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6206LA",
    "name": "Computer Lab 6206LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "0106CR",
    "name": "Classroom 0106CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 0,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "6416CR",
    "name": "Classroom 6416CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 6,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "9102LA",
    "name": "Computer Lab 9102LA",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 9,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "9306CR",
    "name": "Classroom 9306CR",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 9,
    "department": "Computer Engineering",
    "capacity": 70,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "COMP-LAB-203",
    "name": "Computer Lab 203",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 2,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "COMP-LAB-204",
    "name": "Computer Lab 204",
    "type": "Computer Laboratory",
    "building": "Main Building",
    "floor": 2,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Computers",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "active"
  },
  {
    "id": "TEST-LOCK-ROOM-01",
    "name": "Temporary Lock Test Room",
    "type": "Classroom",
    "building": "Main Building",
    "floor": 1,
    "department": "Computer Engineering",
    "capacity": 60,
    "facilities": [
      "Projector",
      "Wi-Fi"
    ],
    "nodeId": "COMP-01",
    "status": "inactive"
  }
];

async function main() {
  console.log("Seeding college resources...");
  await prisma.resource.deleteMany({});
  for (const r of resources) {
    await prisma.resource.create({
      data: r
    });
  }
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
