# 🚀 DistriBook

### Distributed Resource Booking System

A microservices-based distributed resource booking system developed for the **Distributed Systems** course.

DistriBook allows **students, faculty, and administrators** to view resources, check availability, view timetables, and manage resource bookings while preventing scheduling conflicts.

---

## ✨ Features

- 🏫 **Resource Management**
  - Manage classrooms, laboratories, halls, and other resources
  - View resource capacity and facilities

- 🔎 **Resource Availability**
  - Check whether a resource is available for a specific date and time
  - Detect conflicts with existing bookings and timetables

- 📅 **Timetable Integration**
  - Integrate timetable information with resource availability
  - Prevent bookings during scheduled classes

- 📚 **Resource Booking**
  - Create and manage resource bookings
  - Prevent overlapping bookings

- 🔔 **Notification Service**
  - Process booking-related events
  - Uses asynchronous message-based communication

- 📨 **RabbitMQ Messaging**
  - Enables communication between distributed services
  - Supports event-driven notification processing

- 🗄️ **PostgreSQL Database**
  - Provides persistent storage for distributed services
  - Uses Prisma ORM

- 🔐 **Role-Based Authorization**
  - Supports different user roles
  - Provides controlled access to system operations

- 🐳 **Dockerized Backend**
  - Each backend service runs in its own container
  - Docker Compose manages the distributed environment

- ⚛️ **React + Vite Frontend**
  - Interactive web interface
  - Communicates with backend microservices

---

## 🏗️ System Architecture

DistriBook follows a **microservices architecture**, where different services are responsible for different system functions.

```text
                         ┌──────────────────────┐
                         │    React + Vite      │
                         │      Frontend        │
                         │     Port 5173        │
                         └──────────┬───────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
              ▼                     ▼                     ▼
      ┌───────────────┐     ┌───────────────┐     ┌───────────────┐
      │   Resource    │     │   Timetable   │     │    Booking    │
      │    Service    │     │    Service    │     │    Service    │
      │    :3001      │     │    :3002      │     │    :3003      │
      └───────┬───────┘     └───────┬───────┘     └───────┬───────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      PostgreSQL      │
                         │       :5433          │
                         └──────────────────────┘

                                    │
                                    ▼
                         ┌──────────────────────┐
                         │      RabbitMQ        │
                         │ :5672 / :15672       │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Notification       │
                         │      Service         │
                         │       :3004          │
                         └──────────────────────┘
```

### 🔄 Communication Model

DistriBook uses two major communication approaches.

#### Synchronous Communication

```text
Frontend
   │
   ├──► Resource Service
   ├──► Timetable Service
   └──► Booking Service
```

#### Asynchronous Communication

```text
Booking Service
      │
      │ Booking Event
      ▼
   RabbitMQ
      │
      ▼
Notification Service
```

This demonstrates both direct service communication and message-based communication in a distributed system.

---

## 🧩 Backend Services

| Service | Port | Responsibility |
|---|---:|---|
| 🏫 Resource Service | 3001 | Manages resources and resource information |
| 📅 Timetable Service | 3002 | Manages timetable information |
| 📚 Booking Service | 3003 | Handles resource booking operations |
| 🔔 Notification Service | 3004 | Processes booking notifications |
| 🗄️ PostgreSQL | 5433 | Persistent database |
| 📨 RabbitMQ | 5672 | Message broker |
| 🐰 RabbitMQ Management UI | 15672 | RabbitMQ administration interface |
| ⚛️ Frontend | 5173 | React + Vite web application |

---

## 🛠️ Technologies Used

### Frontend

- ⚛️ React
- ⚡ Vite
- JavaScript
- CSS

### Backend

- 🟢 Node.js
- 🔷 TypeScript
- 🚂 Express
- Prisma ORM

### Distributed Systems

- 🧩 Microservices Architecture
- 📨 RabbitMQ
- 🔄 Asynchronous Messaging
- 🔗 Service-to-Service Communication
- ⚡ Concurrent Request Handling

### Database

- 🐘 PostgreSQL

### DevOps and Infrastructure

- 🐳 Docker
- 🐳 Docker Compose
- Git and GitHub

---

## 📁 Project Structure

```text
DistriBook/
│
├── backend/
│   │
│   ├── booking-service/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── messaging/
│   │   │   │   └── rabbitmq.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── server.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── notification-service/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── src/
│   │   │   ├── consumers/
│   │   │   │   └── bookingEvents.consumer.ts
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── server.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── resource-service/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── server.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── timetable-service/
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   └── auth.ts
│   │   │   └── server.ts
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── test_concurrency.js
│   └── test_extended_authorization.js
│
├── frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   │
│   ├── src/
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   │
│   ├── .env.example
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── BTech_Computer_Engineering_Timetable.xlsx
├── Classrooms and labs.txt
├── DistriBookApp.jsx
├── docker-compose.yml
├── .env.example
├── .gitignore
├── query_notifications.sh
└── README.md
```

---

## 🚀 How to Run the Project

### Prerequisites

Install the following software:

- 🟢 Node.js
- 📦 npm
- 🐳 Docker Desktop
- 🔧 Git

Make sure Docker Desktop is running before starting the backend.

### Step 1 — Clone the Repository

If you are setting up the project on another computer, clone the repository:

```bash
git clone https://github.com/Pradnya1227/Distributed-Systems-Distribook.git
```

Enter the project directory:

```bash
cd Distributed-Systems-Distribook
```

If you are already working inside the project directory, skip this step.

### Step 2 — Configure Backend Environment Variables

Create the root environment file from the example.

#### Windows Command Prompt

```cmd
copy .env.example .env
```

#### PowerShell, macOS, or Linux

```bash
cp .env.example .env
```

Open `.env` and set your PostgreSQL password.

Example:

```env
POSTGRES_PASSWORD=your_postgres_password
```

The database connection variables should use the same password.

```env
DATABASE_URL_RESOURCE=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=resource
DATABASE_URL_TIMETABLE=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=timetable
DATABASE_URL_BOOKING=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=booking
DATABASE_URL_NOTIFICATION=postgresql://postgres:your_postgres_password@postgres:5432/distribook?schema=notification
```

> ⚠️ Never commit `.env` files containing real passwords or credentials.

### Step 3 — Start the Backend

From the project root directory, run:

```bash
docker compose up --build
```

Docker Compose will start:

- PostgreSQL
- RabbitMQ
- Resource Service
- Timetable Service
- Booking Service
- Notification Service

The first build may take some time because Docker needs to download dependencies and build the service images.

Keep this terminal running.

### Step 4 — Verify Backend Services

| Component | Address |
|---|---|
| Resource Service | http://localhost:3001 |
| Timetable Service | http://localhost:3002 |
| Booking Service | http://localhost:3003 |
| Notification Service | http://localhost:3004 |
| PostgreSQL | `localhost:5433` |
| RabbitMQ | `localhost:5672` |
| RabbitMQ Management UI | http://localhost:15672 |

To open the RabbitMQ Management UI, visit:

```text
http://localhost:15672
```

### Step 5 — Open a New Terminal

Keep the Docker terminal running.

Open another terminal and move into the frontend directory:

```bash
cd frontend
```

### Step 6 — Install Frontend Dependencies

Run:

```bash
npm install
```

This installs all frontend dependencies defined in `package.json`.

### Step 7 — Configure Frontend Environment Variables

Create the frontend environment file.

#### Windows Command Prompt

```cmd
copy .env.example .env
```

#### PowerShell, macOS, or Linux

```bash
cp .env.example .env
```

The frontend should point to the backend services:

```env
VITE_RESOURCE_SERVICE_URL=http://localhost:3001
VITE_TIMETABLE_SERVICE_URL=http://localhost:3002
VITE_BOOKING_SERVICE_URL=http://localhost:3003
```

### Step 8 — Start the Frontend

Run:

```bash
npm run dev
```

Vite will display the local development URL.

Normally, the frontend runs at:

```text
http://localhost:5173
```

Open the displayed URL in your browser.

If port `5173` is already occupied, Vite may automatically select another port, such as:

```text
http://localhost:5174
```

Always use the URL shown in the terminal.

### Step 9 — Stop the Project

#### Stop the Frontend

Press:

```text
Ctrl + C
```

#### Stop the Docker Backend

From the project root directory, run:

```bash
docker compose down
```

This stops and removes the running containers while preserving named Docker volumes unless they are explicitly removed.

### Step 10 — Start the Project Again

Once the Docker images have been built, you normally do not need to rebuild them.

#### Start the Backend

```bash
docker compose up
```

#### Start the Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

### 🔨 When Should You Use `--build`?

Use:

```bash
docker compose up --build
```

when you have made changes to:

- Backend source code
- Dockerfiles
- Backend dependencies
- Docker Compose configuration
- Other files used while building Docker images

For normal subsequent runs, use:

```bash
docker compose up
```

---

## 🧪 Testing

DistriBook includes tests demonstrating distributed-system behaviour.

### 🔄 Concurrency Testing

The concurrency test checks how the system behaves when multiple booking requests are made concurrently.

Run from the project root:

```bash
node backend/test_concurrency.js
```

### 🔐 Extended Authorization Testing

The authorization test checks access control and role-based behaviour.

Run:

```bash
node backend/test_extended_authorization.js
```

---

## 🧠 Distributed Systems Concepts Demonstrated

### 1. Microservices Architecture

The application is divided into independent services:

- Resource Service
- Timetable Service
- Booking Service
- Notification Service

Each service has its own responsibility and can operate independently.

### 2. Service-to-Service Communication

Backend services communicate with other services when information from another service is required.

```text
Booking Service
      │
      ├──► Resource Service
      │
      └──► Timetable Service
```

### 3. Message-Based Communication

RabbitMQ is used to exchange messages between distributed services.

```text
Booking Service
      │
      ▼
   RabbitMQ
      │
      ▼
Notification Service
```

This provides asynchronous communication between services.

### 4. Concurrent Booking Handling

The system handles multiple booking requests and performs conflict checks to prevent invalid overlapping bookings.

### 5. Conflict Detection

Bookings are checked against:

- Existing bookings
- Timetable entries
- Blocked resources
- Resource availability

### 6. Database Persistence

PostgreSQL provides persistent storage for the application.

### 7. Fault Isolation

Because the application is divided into services, failures can be isolated to individual components instead of requiring the entire application to run as one process.

### 8. Containerization

Docker containers package backend services and their dependencies into reproducible environments.

### 9. Role-Based Authorization

Different users have different permissions based on their assigned roles.

### 10. Asynchronous Event Processing

Booking-related events can be processed asynchronously by the Notification Service through RabbitMQ.

---

## 🔐 Security

Environment files containing passwords, database credentials, API keys, authentication tokens, or other secrets must never be committed to GitHub.

The repository provides `.env.example` files as safe configuration templates.

Never commit:

- `.env` files
- Passwords
- API keys
- Authentication tokens
- Database credentials
- Private keys
- Other secrets

The `.gitignore` file is configured to prevent environment files, dependencies, build output, and other unnecessary files from being committed.

---

## 🌱 Environment Configuration

The project uses environment files for local configuration.

| Environment File | Purpose |
|---|---|
| `.env.example` | Used for Docker Compose and backend database configuration |
| `frontend/.env.example` | Used for frontend service URLs |

When setting up the project on another computer:

1. Copy the example environment file.
2. Create your local `.env` file.
3. Add your local configuration.
4. Never commit the actual `.env` file.

---

## 🗄️ Data Files

### Timetable Data

```text
BTech_Computer_Engineering_Timetable.xlsx
```

Contains the Computer Engineering timetable data used by the project.

### Resource Data

```text
Classrooms and labs.txt
```

Contains information about available classrooms, laboratories, halls, and other facilities.

---

## 📨 Notification Queries

The project also includes:

```text
query_notifications.sh
```

This script can be used for querying notification-related information during development and testing.

---

## 🐳 Useful Docker Commands

### Start services

```bash
docker compose up
```

### Start and rebuild services

```bash
docker compose up --build
```

### Run services in detached mode

```bash
docker compose up -d
```

### Stop services

```bash
docker compose down
```

### View running containers

```bash
docker ps
```

### View Docker Compose logs

```bash
docker compose logs
```

### View logs for a specific service

```bash
docker compose logs booking-service
```

---

## 📚 Academic Project

| Item | Details |
|---|---|
| 🎓 Course | Distributed Systems |
| 🚀 Project | DistriBook – Distributed Resource Booking System |
| 🏗️ Architecture | Microservices |
| 📨 Messaging | RabbitMQ |
| 🗄️ Database | PostgreSQL |
| 🐳 Containerization | Docker + Docker Compose |
| ⚛️ Frontend | React + Vite |
| 🔷 Backend | Node.js + TypeScript + Express |
| 🧩 ORM | Prisma |
| 🌐 Repository | Distributed-Systems-Distribook |

---

## 🎯 Project Objective

The objective of DistriBook is to demonstrate how distributed-system principles can be applied to a practical resource booking problem.

The system combines:

```text
Microservices
     +
Message Queues
     +
Database Persistence
     +
Concurrent Request Handling
     +
Role-Based Authorization
     +
Containerization
```

This creates a distributed platform for managing college resources efficiently.

---

## 👩‍💻 Developed For

**Distributed Systems – Academic Project**

**DistriBook – Distributed Resource Booking System**

⭐ If you find this project useful, consider giving the repository a star!
