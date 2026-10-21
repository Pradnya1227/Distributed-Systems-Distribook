# DistriBook — Distributed Resource Booking System

A microservices-based resource booking system developed. DistriBook helps students, faculty, and administrators explore college resources, check availability, view timetables, and manage bookings while detecting scheduling conflicts.

## 1. Features

- **Resource Management:** View classrooms, laboratories, seminar halls, and other college resources.
- **Timetable Integration:** Check scheduled classes before booking resources.
- **Booking Management:** Create booking requests and detect overlapping bookings.
- **Concurrency Handling:** Test simultaneous booking requests for the same resource and time slot.
- **Notification Processing:** Process booking events asynchronously using RabbitMQ.
- **Lamport Logical Clocks:** Attach logical timestamps to booking events and update clocks when notifications are processed.
- **Health Monitoring:** Check backend service health and display service status in the frontend.
- **Role-Based Authorization:** Apply role-based access checks to supported API operations.
- **Persistent Storage:** Store application data in PostgreSQL.
- **Containerization:** Run backend services and infrastructure using Docker Compose.

## 2. System Architecture

DistriBook uses a microservices architecture with four backend services.

```text
                    React + Vite Frontend
                       localhost:5173
                              |
             +----------------+----------------+
             |                |                |
             v                v                v
       Resource Service  Timetable Service  Booking Service
          :3001              :3002             :3003
                                                  |
                                     +------------+------------+
                                     |                         |
                                     v                         v
                                PostgreSQL                 RabbitMQ
                                     |                         |
                                     |                         v
                                     |                 Notification Service
                                     |                        :3004
                                     +-------------------------+

                 PostgreSQL host port: 5433
                 RabbitMQ: 5672
                 RabbitMQ Management UI: 15672
```

### 2.1 Backend Services

| Service | Port | Responsibility |
|---|---:|---|
| Resource Service | 3001 | Resource information and availability-related operations |
| Timetable Service | 3002 | Timetable information |
| Booking Service | 3003 | Booking operations and conflict checks |
| Notification Service | 3004 | Asynchronous booking-event processing |
| PostgreSQL | 5433 | Persistent data storage |
| RabbitMQ | 5672 | Message broker |
| RabbitMQ Management UI | 15672 | Message broker administration |
| React + Vite | 5173 | Web interface |

### 2.2 Communication Model

**Synchronous communication:** The frontend calls backend APIs. The Booking Service also communicates with the Resource and Timetable Services when required.

**Asynchronous communication:** The Booking Service publishes booking-related events through RabbitMQ. The Notification Service consumes these events and processes them asynchronously.

### 2.3 Lamport Logical Clocks

DistriBook demonstrates logical clocks in the booking-event flow.

1. The Booking Service increments its logical clock when generating a booking event.
2. The event carries its Lamport timestamp in the message payload and message headers.
3. The Notification Service reads the timestamp and updates its logical clock.
4. Processed notifications include the logical clock value for demonstration and verification.

The `/lamport` endpoints on the Booking and Notification Services expose clock information for testing.

**Limitation:** The logical clocks are maintained in memory and reset when the corresponding service restarts. They are not persistent clocks.

## 3. Technologies Used

**Frontend**
- React
- Vite
- JavaScript and CSS

**Backend**
- Node.js
- TypeScript
- Express
- Prisma ORM

**Database and Messaging**
- PostgreSQL
- RabbitMQ

**Infrastructure and Tools**
- Docker
- Docker Compose
- Git and GitHub

## 4. Project Setup

### 4.1 Prerequisites

Install the following:

- Git
- Node.js and npm
- Docker Desktop

Start Docker Desktop before running the backend.

### 4.2 Clone the Repository

```powershell
git clone https://github.com/Pradnya1227/Distributed-Systems-Distribook.git
cd Distributed-Systems-Distribook
```

If the repository is already present on your computer, open PowerShell in the project directory instead.

### 4.3 Configure Environment Variables

Create a root `.env` file from the example:

```powershell
Copy-Item .env.example .env
```

Open `.env` and replace `your_postgres_password` with a password of your choice. Use the same password in all four database connection URLs.

```env
POSTGRES_PASSWORD=your_postgres_password

DATABASE_URL_RESOURCE=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=resource
DATABASE_URL_TIMETABLE=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=timetable
DATABASE_URL_BOOKING=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=booking
DATABASE_URL_NOTIFICATION=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=notification
```

These values are an example. Use the same actual password in all five places.

If your password contains special characters, URL-encode those characters in the database connection URLs as required by PostgreSQL connection-string syntax.

Never commit the actual `.env` file or other credentials to GitHub.

**Configuration requirement:** The root `docker-compose.yml` must reference `${POSTGRES_PASSWORD}` and the corresponding `${DATABASE_URL_...}` variables. Resolve any leftover Git merge-conflict markers before starting Docker Compose.

### 4.4 Start the Backend

After resolving the Docker Compose configuration, run this command from the project root:

```powershell
docker compose up --build
```

Docker Compose builds the backend service images and starts the configured infrastructure and backend services:

- PostgreSQL
- RabbitMQ
- Resource Service
- Timetable Service
- Booking Service
- Notification Service

The first build may take several minutes. Keep the terminal running while using the application.

### 4.5 Verify Backend Health

Open these URLs in your browser:

| Service | Health endpoint |
|---|---|
| Resource Service | `http://localhost:3001/health` |
| Timetable Service | `http://localhost:3002/health` |
| Booking Service | `http://localhost:3003/health` |
| Notification Service | `http://localhost:3004/health` |

A successful health endpoint should return an HTTP success response when the service is running.

RabbitMQ's management interface is available at:

`http://localhost:15672`

The default RabbitMQ image credentials are typically `guest` / `guest` for local development. Do not use these defaults for a production deployment.

### 4.6 Start the Frontend

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
```

If the frontend requires environment variables, inspect `frontend/.env.example` and create `frontend/.env` from that file, following its documented variable names.

Start the frontend:

```powershell
npm run dev
```

Open the URL printed by Vite. The expected development URL is:

`http://localhost:5173`

If Vite selects another port because port 5173 is occupied, use the URL printed in the terminal.

### 4.7 Stop and Restart the Application

Stop the frontend by pressing `Ctrl + C` in its terminal.

Stop the backend containers from the project root:

```powershell
docker compose down
```

To start the backend again:

```powershell
docker compose up
```

To rebuild images after backend source, dependency, Dockerfile, or build-configuration changes:

```powershell
docker compose up --build
```

Named database and RabbitMQ volumes are preserved by `docker compose down`. Do not use `docker compose down -v` unless you intentionally want to remove the associated persistent volumes.

## 5. Testing

Run the test scripts from the project root while the required backend services are running.

### 5.1 Concurrent Booking Test

```powershell
node backend/test_concurrency.js
```

This test checks simultaneous booking requests for the same time slot. The expected demonstration is that one request succeeds and the conflicting request is rejected.

### 5.2 Authorization Test

```powershell
node backend/test_extended_authorization.js
```

This script exercises the project's extended authorization scenarios.

### 5.3 Lamport Clock Test

```powershell
node backend/test_lamport.js
```

This test verifies the logical-clock behaviour implemented in the booking and notification event flow.

### 5.4 System Verification

If `system_check.ps1` is present in the repository, run it from PowerShell:

```powershell
.\system_check.ps1
```

Review the script's output for container status, service health responses, API checks, and database resource counts. The script's checks depend on the services and environment being configured correctly.

## 6. Distributed Systems Concepts Demonstrated

1. **Microservices Architecture:** Separates resource, timetable, booking, and notification responsibilities.
2. **Service-to-Service Communication:** Allows backend services to request information from other services.
3. **Asynchronous Messaging:** Uses RabbitMQ to transmit booking events to the Notification Service.
4. **Concurrency Handling:** Tests simultaneous requests and booking conflicts.
5. **Conflict Detection:** Checks resource availability, timetable entries, and existing bookings where supported by the application.
6. **Database Persistence:** Uses PostgreSQL to store application data.
7. **Containerization:** Packages backend services into Docker containers.
8. **Health Monitoring:** Exposes health endpoints and displays service status in the frontend.
9. **Role-Based Authorization:** Demonstrates access checks based on supported user roles.
10. **Lamport Logical Clocks:** Demonstrates logical timestamp propagation and clock updates across a message-based event flow.

## 7. Section 4.2 — Screenshots

Capture the following screenshots from the running application for the project report.

| No. | Screenshot | Suggested caption |
|---|---|---|
| 1 | DistriBook home page | Figure 4.2.1: DistriBook application home page |
| 2 | Resource listing | Figure 4.2.2: Available classrooms, laboratories, and other resources |
| 3 | Timetable or availability view | Figure 4.2.3: Timetable and resource availability |
| 4 | Booking interface | Figure 4.2.4: Resource booking interface |
| 5 | Concurrent booking test output | Figure 4.2.5: Concurrent booking conflict verification |
| 6 | Authorization test output | Figure 4.2.6: Authorization test results |
| 7 | Service health endpoints or frontend status page | Figure 4.2.7: Backend service health monitoring |
| 8 | Lamport test output or notification with logical timestamp | Figure 4.2.8: Lamport logical clock demonstration |
| 9 | Docker containers | Figure 4.2.9: DistriBook services running through Docker Compose |
| 10 | RabbitMQ Management UI | Figure 4.2.10: RabbitMQ message broker management interface |

Use screenshots of features that are actually implemented and verified. Do not label a planned or incomplete feature as a completed demonstration.

## 8. Limitations

- Lamport logical clocks are in-memory and reset when services restart.
- The project is an academic demonstration and is not presented as a production-ready deployment.
- Authentication and authorization capabilities should be evaluated against the actual implementation before being used for real users.
- Health endpoints indicate service health but do not, by themselves, guarantee that every dependent service or business operation is functioning correctly.

## 9. Security Notes

- Keep `.env` files and credentials out of version control.
- Use `.env.example` for placeholder configuration only.
- Change default development credentials before any non-local deployment.
- Do not expose database or message-broker ports publicly without appropriate access controls.
- Review authentication, authorization, input validation, and secret management before production use.

## 10. Useful Docker Commands

```powershell
# Start containers
docker compose up

# Build images and start containers
docker compose up --build

# Start containers in the background
docker compose up -d

# Stop containers
docker compose down

# Show running containers
docker ps

# Show service logs
docker compose logs

# Follow logs for one service
docker compose logs -f booking-service

# Show container status
docker compose ps
```

## 11. Academic Project Information

| Item | Details |
|---|---|
| Project | DistriBook — Distributed Resource Booking System |
| Course | Distributed Systems |
| Architecture | Microservices |
| Database | PostgreSQL |
| Messaging | RabbitMQ |
| Backend | Node.js, TypeScript, Express |
| ORM | Prisma |
| Frontend | React and Vite |
| Containerization | Docker and Docker Compose |
| Repository | [Distributed-Systems-Distribook](https://github.com/Pradnya1227/Distributed-Systems-Distribook) |

**Project objective:** Demonstrate distributed-system principles through a college resource booking application, including independent services, service communication, asynchronous event processing, concurrency handling, health monitoring, and logical clocks.
