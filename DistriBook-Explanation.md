# DistriBook — Distributed Resource Booking System
### Project Explanation Page (for teammates & viva prep)

---

## 1. What Is DistriBook?

DistriBook is a **distributed resource booking system** built for a college environment, developed as a project for the **Distributed Systems** course.

It lets students, faculty, and administrators:

- View available classrooms, labs, and halls
- Check resource availability for a given date/time
- View timetable information
- Book resources while preventing conflicts
- Receive notifications about booking events
- Operate under role-based permissions

The key design decision is that DistriBook is **not** one big application. The backend is split into independent **microservices**, each owning one responsibility.

---

## 2. Why This Project Exists (Problem Statement)

Colleges share limited resources — classrooms, computer labs, seminar halls, auditoriums — across many departments. If two people try to book the same room at the same time, a naive system could let both bookings succeed.

The system therefore needs to handle:

- Resource management
- Availability & timetable conflict checks
- Concurrent booking requests
- Communication between independent components
- Persistent storage
- Notifications
- Authorization by role

These requirements are exactly what makes it a good vehicle for demonstrating **Distributed Systems** concepts, not just a CRUD app.

---

## 3. System Architecture

```
                         ┌──────────────┐
                         │     USER     │
                         └──────┬───────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │ React + Vite UI │
                       │     :5173       │
                       └────────┬────────┘
                                │
                    HTTP REST Communication
                                │
             ┌──────────────────┼──────────────────┐
             │                  │                  │
             ▼                  ▼                  ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │   Resource   │   │  Timetable   │   │   Booking    │
     │   Service    │   │   Service    │   │   Service    │
     │    :3001     │   │    :3002     │   │    :3003     │
     └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
            │                  │                  │
            └──────────────────┼──────────────────┘
                                │
                                ▼
                       ┌──────────────┐
                       │  PostgreSQL  │
                       │    :5433     │
                       └──────────────┘
                                │
                          Booking Event
                                │
                                ▼
                       ┌──────────────┐
                       │  RabbitMQ    │
                       │    :5672     │
                       └──────┬───────┘
                              │
                              ▼
                  ┌────────────────────┐
                  │ Notification       │
                  │ Service  :3004     │
                  └────────────────────┘
```

**One-line summary:** DistriBook uses a microservices architecture where independent services communicate through REST and RabbitMQ, persist data in PostgreSQL, and run in Docker containers — giving a scalable, isolated, reproducible distributed system.

---

## 4. Backend Services at a Glance

| Service | Port | Responsibility |
|---|---|---|
| 🏫 Resource Service | 3001 | Manages resources (rooms, labs, halls) and their metadata |
| 📅 Timetable Service | 3002 | Manages academic timetable / scheduled classes |
| 📚 Booking Service | 3003 | Handles booking creation and conflict detection |
| 🔔 Notification Service | 3004 | Processes booking-related events asynchronously |
| 🗄️ PostgreSQL | 5433 | Persistent database (host-mapped from container's 5432) |
| 📨 RabbitMQ | 5672 | Message broker for async communication |
| 🐰 RabbitMQ Management UI | 15672 | Web dashboard for inspecting queues |
| ⚛️ Frontend (React + Vite) | 5173 | User-facing web app |

---

## 5. Communication Model: Synchronous vs Asynchronous

DistriBook deliberately uses **both** communication styles, for different reasons.

### Synchronous (REST)
```
Frontend ──► Resource Service
Frontend ──► Timetable Service
Frontend ──► Booking Service
```
Used when the caller needs an **immediate answer** — e.g. "is this room available right now?"

### Asynchronous (RabbitMQ)
```
Booking Service ──(Booking Event)──► RabbitMQ ──► Notification Service
```
Used when the caller does **not** need to wait for the result — e.g. sending a notification after a booking succeeds. The Booking Service publishes the event and moves on; the Notification Service consumes it independently.

**Why not make everything asynchronous, or everything synchronous?**
- A user asking "is this room free?" needs an immediate response → REST.
- A notification doesn't need to block the booking response → RabbitMQ.

---

## 6. Why Microservices?

**Monolithic approach (not used):**
```
              ONE BIG APPLICATION
        ┌─────────────────────────────┐
        │ Resources / Timetable /     │
        │ Bookings / Notifications /  │
        │ Auth — all in one process   │
        └─────────────────────────────┘
```

**DistriBook's approach:**
```
┌───────────┐  ┌────────────┐  ┌───────────┐  ┌──────────────┐
│ Resource  │  │ Timetable  │  │ Booking   │  │ Notification │
│ Service   │  │ Service    │  │ Service   │  │ Service      │
└───────────┘  └────────────┘  └───────────┘  └──────────────┘
```

Benefits this gives us:

1. **Separation of concerns** — each service owns one job.
2. **Fault isolation** — one service failing doesn't necessarily take down the rest.
3. **Independent development** — teammates can work on different services in parallel.
4. **Independent deployment** — services can be rebuilt/redeployed separately.
5. **Independent scalability** — e.g. scale only the Booking Service under heavy load, while Resource/Timetable stay at one instance.

---

## 7. Deep Dive: What Each Service Does

### Resource Service
Manages bookable resources — ID, name, type, capacity, building, department, facilities, status (e.g. `6101CR` = Classroom, capacity 60, Active). Kept separate because resource management is its own business concern, independent of how booking or notifications work.

### Timetable Service
Manages scheduled academic activities (e.g. a class in Room 6202CR from 10:00–11:00). The Booking Service consults this to reject bookings that overlap existing classes.

### Booking Service — the core business logic
For a booking request, it checks, in order:
```
Booking Request
      │
      ▼
Is resource valid & active?
      │
      ▼
Is capacity sufficient?
      │
      ▼
Any timetable conflict?
      │
      ▼
Any existing booking conflict?
      │
      ▼
Create booking
```
If any check fails, the booking is rejected.

### Notification Service
Consumes `BOOKING_CREATED` (and similar) events from RabbitMQ and processes them — deliberately decoupled from the Booking Service so booking creation doesn't have to wait on notification logic.

---

## 8. Complete Booking Workflow (Worked Example)

**Scenario:** A student wants to book Room `6204CR` on Monday, 2:00 PM – 3:00 PM.

1. User selects the resource, date, and time on the React frontend (`:5173`).
2. Frontend sends the request to the Booking Service (`:3003`).
3. Booking Service verifies the resource is valid and active.
4. Booking Service checks the Timetable Service for conflicts (e.g. is there a class scheduled 2–3 PM in that room?).
5. Booking Service checks existing bookings for overlap.
6. Capacity and other validation rules are checked.
7. If everything passes, the booking is written to PostgreSQL.
8. Booking Service publishes a `BOOKING_CREATED` event to RabbitMQ.
9. Notification Service consumes the event from the queue.
10. Notification Service processes/generates the notification.

One user action → coordinated work across multiple independent, distributed components.

---

## 9. Handling Concurrent Bookings (Race Conditions)

This is one of the most important Distributed Systems ideas in the project.

**The problem:**
```
User A                         User B
Check room                     Check room
   │                               │
   ▼                               ▼
Available                      Available
   │                               │
   ▼                               ▼
Create booking                 Create booking
```
If two users request the same room/time nearly simultaneously, a naive "check-then-create" flow can let **both** bookings succeed — a classic **race condition**.

**Why it matters:** the system must guarantee **consistency** even under concurrent access, not just correctness for a single user acting alone.

**How we verify it:** `backend/test_concurrency.js` fires overlapping booking requests and checks that the system does not allow conflicting bookings through.

**Talking point for viva:**
> "Multiple clients can request the same resource at nearly the same time. Our booking logic and concurrency test are designed to detect and prevent this race condition, keeping the system consistent."

---

## 10. Authorization

DistriBook supports different user roles (Student, Faculty, Admin) with different permissions. This is tested via `backend/test_extended_authorization.js`, which checks role-based access control across operations.

---

## 11. Data Layer: PostgreSQL + Prisma

- **PostgreSQL** provides persistent, relational storage — without it, bookings would vanish on every restart.
- **Prisma** is the ORM layer used from the Node.js/TypeScript services, giving type-safe queries, schema management, and migrations instead of hand-written SQL.
- Each service works against its **own logical schema** inside a shared PostgreSQL instance:

```
PostgreSQL
│
├── resource schema
├── timetable schema
├── booking schema
└── notification schema
```

**Why one PostgreSQL instance instead of fully separate databases?**
For this academic implementation, one instance keeps operations simple, while separate schemas still preserve the microservices' logical data boundaries. In a larger production system, these could be split into fully independent databases.

**Why is the frontend not allowed to talk to PostgreSQL directly?**
```
Frontend → Backend Service → Database
```
Keeping data access behind services preserves the service boundary and business rules (validation, conflict checks, authorization).

---

## 12. Why Docker & Docker Compose?

**Problem without Docker:** every teammate must manually install and configure Node.js, PostgreSQL, RabbitMQ, and keep versions in sync — a classic "works on my machine" situation.

**Docker's solution:** each service (and PostgreSQL, RabbitMQ) runs in its own container with its dependencies bundled in.

```
Docker
│
├── PostgreSQL Container
├── RabbitMQ Container
├── Resource Service Container
├── Timetable Service Container
├── Booking Service Container
└── Notification Service Container
```

**Docker Compose** (`docker-compose.yml`) defines all of these services, their ports, environment variables, dependencies, and volumes in one file, so the whole backend starts with a single command:

```
docker compose up --build   # first run / after code or Dockerfile changes
docker compose up           # subsequent runs
docker compose down         # stop everything
```

**Docker networking:** containers can reach each other by service name instead of hardcoded IPs, e.g. `booking-service` can call `http://resource-service:3001` or `rabbitmq:5672` directly.

**`depends_on` caveat (good viva detail):** it controls *startup order*, not *readiness* — a dependent service can still fail if it starts calling another service before that service is actually ready to accept requests. Robust services should handle retries/connection checks accordingly.

**Persistence across container restarts:** named Docker volumes (`pgdata`, `rabbitmq_data`) keep database and broker data intact even when containers are recreated.

---

## 13. Port Reference & Why They're Different

| Component | Host Port | Notes |
|---|---|---|
| Resource Service | 3001 | |
| Timetable Service | 3002 | |
| Booking Service | 3003 | |
| Notification Service | 3004 | |
| PostgreSQL | 5433 | Mapped from container's default 5432, to avoid clashing with any PostgreSQL already installed on the host |
| RabbitMQ | 5672 | Application/messaging traffic |
| RabbitMQ Management UI | 15672 | Browser dashboard at `http://localhost:15672` |
| Frontend | 5173 | Vite dev server (auto-shifts to 5174, etc. if busy) |

---

## 14. Technology Stack Summary

| Layer | Technology | Why |
|---|---|---|
| Frontend | React | Build the user interface |
| Frontend | Vite | Fast dev server / build tooling |
| Backend runtime | Node.js | JavaScript runtime for services |
| Backend language | TypeScript | Type safety across services |
| Backend framework | Express | REST API server |
| Database | PostgreSQL | Persistent relational storage |
| ORM | Prisma | Type-safe DB access, migrations |
| Messaging | RabbitMQ | Asynchronous, event-driven communication |
| Containerization | Docker / Docker Compose | Consistent, reproducible environments |
| Version control | Git / GitHub | Collaboration and history |

---

## 15. Fault Isolation & Scalability

**Fault isolation:** because services are separate processes, a failure in one (e.g. Notification Service) doesn't automatically bring down the others. The actual blast radius depends on which service depends on which, but the architecture is designed to reduce it compared to a monolith.

**Scalability:** if booking traffic spikes, only the Booking Service needs more instances:
```
              Booking Requests
                     │
             ┌───────┼───────┐
             ▼       ▼       ▼
          Booking  Booking  Booking
          Instance Instance Instance
             1        2        3
```
while Resource Service and Timetable Service can remain at a single instance each.

---

## 16. Distributed Systems Concepts Demonstrated

| Concept | How DistriBook demonstrates it |
|---|---|
| Distributed components | Multiple independent microservices |
| Network communication | REST APIs between frontend and services |
| Message passing | RabbitMQ between Booking and Notification services |
| Asynchronous communication | Booking events processed without blocking |
| Concurrency | Multiple users booking simultaneously |
| Race conditions | Concurrent booking requests for the same resource |
| Consistency | Conflict detection preventing double-booking |
| Fault isolation | Independent services/containers |
| Scalability | Services can be scaled independently |
| Persistence | PostgreSQL storage |
| Containerization | Docker packages each component |
| Service independence | Separate, individually deployable services |
| Authorization | Role-based access control |

---

## 17. Two-Minute Spoken Summary (for viva)

> "Our project is DistriBook, a distributed resource booking system built for the Distributed Systems course. It lets students, faculty, and administrators view college resources, check availability, view timetables, and book classrooms, labs, or halls.
>
> The backend uses a microservices architecture with four independent services: Resource Service on port 3001, Timetable Service on 3002, Booking Service on 3003, and Notification Service on 3004. Services communicate over REST for synchronous operations and RabbitMQ for asynchronous, event-driven communication. PostgreSQL handles persistent storage via Prisma, and Docker Compose containerizes and runs everything consistently.
>
> When a user requests a booking, the Booking Service validates the resource, checks timetable and existing-booking conflicts, and — if everything passes — creates the booking and publishes an event to RabbitMQ, which the Notification Service consumes.
>
> The project demonstrates core Distributed Systems ideas: microservices, network and message-based communication, concurrency and race-condition handling, consistency, fault isolation, independent scalability, persistence, and containerization."

---

## 18. Likely Viva Questions & Answers

**Q1. Why is this a Distributed Systems project?**
Because it consists of multiple independent services running as separate processes/containers that communicate over the network (REST) and via messaging (RabbitMQ), rather than one single process handling everything.

**Q2. Why microservices instead of a monolith?**
Separation of concerns, fault isolation, independent development/deployment, and independent scalability.

**Q3. Why RabbitMQ?**
To decouple the Booking Service from the Notification Service — the booking flow doesn't have to wait for notification processing to finish.

**Q4. Why PostgreSQL?**
Reliable, persistent relational storage for resources, bookings, and timetable data.

**Q5. Why Prisma?**
A type-safe ORM that integrates cleanly with TypeScript and simplifies migrations/queries versus raw SQL.

**Q6. Why Docker / Docker Compose?**
Consistent environments across teammates' machines, simplified setup, container-level isolation, and one command to bring up the whole backend.

**Q7. What happens if two users book the same room at the same time?**
A potential race condition — both might see the room as "available" before either booking is committed. The system's conflict-check logic and the concurrency test (`test_concurrency.js`) are designed to prevent both from succeeding.

**Q8. Why use both REST and RabbitMQ?**
REST for operations needing an immediate answer (e.g. availability checks); RabbitMQ for events that don't need to block the caller (e.g. notifications).

**Q9. What happens if the Notification Service goes down?**
Because it's decoupled via the message queue, booking creation isn't directly blocked by it — the actual message-delivery guarantees depend on the queue/consumer configuration.

**Q10. Can the Booking Service be scaled independently?**
Yes — since it's a separate service, more instances can be run behind a load balancer if demand increases, without touching the other services.

**Q11. Why one PostgreSQL instance if this is "microservices"?**
For this academic build, one instance keeps things manageable, but each service uses its own schema to preserve logical data separation — that boundary could be split into fully separate databases later.

**Q12. What does `depends_on` actually guarantee in Docker Compose?**
Only container *startup order* — not that the dependency is fully ready to serve requests. Services should still handle connection retries.

---

## 19. Suggested Prep Split for the Team

Give each teammate 2–3 of the following to "own" for the viva, while everyone memorizes the architecture diagram and the booking workflow (Sections 3 and 8):

- Resource Service + Timetable Service
- Booking Service + concurrency/conflict logic
- Notification Service + RabbitMQ
- PostgreSQL + Prisma + schema design
- Docker + Docker Compose + networking
- Frontend (React/Vite) + overall Distributed Systems concepts
