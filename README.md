\# DistriBook – Distributed Resource Booking System



DistriBook is a distributed resource booking system developed for the Distributed Systems course.



It allows students, faculty, and administrators to view resources, check availability, view timetables, and manage resource bookings.



\## Features



\- Resource management

\- Resource availability checking

\- Timetable integration

\- Resource booking

\- Booking conflict prevention

\- Notification service

\- RabbitMQ-based messaging

\- PostgreSQL database

\- Role-based authorization

\- Docker-based backend services

\- React + Vite frontend



\## Architecture



DistriBook follows a microservices-based architecture.



\### Backend Services



| Service | Port | Purpose |

|---|---:|---|

| Resource Service | 3001 | Manages college resources |

| Timetable Service | 3002 | Manages timetable information |

| Booking Service | 3003 | Handles resource bookings |

| Notification Service | 3004 | Handles booking notifications |

| PostgreSQL | 5433 | Persistent database |

| RabbitMQ | 5672 | Message broker |

| RabbitMQ Management UI | 15672 | RabbitMQ management interface |



The frontend is built using React and Vite.



\## Technologies Used



\- React

\- Vite

\- Node.js

\- TypeScript

\- Express

\- PostgreSQL

\- Prisma

\- RabbitMQ

\- Docker

\- Docker Compose



\## Project Structure



```text

DistriBook/

├── backend/

│   ├── booking-service/

│   ├── notification-service/

│   ├── resource-service/

│   ├── timetable-service/

│   ├── test\_concurrency.js

│   └── test\_extended\_authorization.js

├── frontend/

├── BTech\_Computer\_Engineering\_Timetable.xlsx

├── Classrooms and labs.txt

├── docker-compose.yml

├── .env.example

├── .gitignore

└── query\_notifications.sh

```



\## How to Run the Project



\### Prerequisites



Install the following:



\- Node.js

\- npm

\- Docker Desktop

\- Git



Make sure Docker Desktop is running before starting the backend.



\### Step 1 – Clone the Repository



If you are setting up the project on a new computer, clone the repository:



```bash

git clone https://github.com/Pradnya1227/Distributed-Systems-Distribook.git

```



Enter the project directory:



```bash

cd Distributed-Systems-Distribook

```



\### Step 2 – Configure Environment Variables



Create the root environment file from the example.



For Windows Command Prompt:



```cmd

copy .env.example .env

```



For PowerShell, macOS, or Linux:



```bash

cp .env.example .env

```



Open `.env` and set your PostgreSQL password.



Example:



```env

POSTGRES\_PASSWORD=your\_postgres\_password

```



The database connection variables should use the same password.



> Do not commit `.env` files to GitHub.



\### Step 3 – Start the Backend



From the project root directory, run:



```bash

docker compose up --build

```



This starts:



\- PostgreSQL

\- RabbitMQ

\- Resource Service

\- Timetable Service

\- Booking Service

\- Notification Service



The first build may take some time because Docker needs to build the service images.



\### Step 4 – Verify the Backend Services



The services use the following ports:



| Service | Address |

|---|---|

| Resource Service | http://localhost:3001 |

| Timetable Service | http://localhost:3002 |

| Booking Service | http://localhost:3003 |

| Notification Service | http://localhost:3004 |

| RabbitMQ Management UI | http://localhost:15672 |



Keep the Docker terminal running while using the project.



\### Step 5 – Open a New Terminal



Open another terminal while Docker continues running.



If you are in the project root directory, run:



```bash

cd frontend

```



\### Step 6 – Install Frontend Dependencies



Run:



```bash

npm install

```



\### Step 7 – Configure the Frontend



Create the frontend environment file.



For Windows Command Prompt:



```cmd

copy .env.example .env

```



For PowerShell, macOS, or Linux:



```bash

cp .env.example .env

```



The local configuration should point to the backend services:



```env

VITE\_RESOURCE\_SERVICE\_URL=http://localhost:3001

VITE\_TIMETABLE\_SERVICE\_URL=http://localhost:3002

VITE\_BOOKING\_SERVICE\_URL=http://localhost:3003

```



\### Step 8 – Start the Frontend



Run:



```bash

npm run dev

```



Vite will display the local address in the terminal.



Normally, the frontend runs at:



```text

http://localhost:5173

```



Open the displayed URL in your browser.



If port `5173` is already being used, Vite may automatically select another port, such as:



```text

http://localhost:5174

```



Use the URL shown by Vite in the terminal.



\### Step 9 – Stop the Project



To stop the frontend, press:



```text

Ctrl + C

```



To stop the Docker backend services, run from the project root:



```bash

docker compose down

```



\### Step 10 – Start the Project Again



After the project has already been built, you normally do not need to rebuild the Docker images.



Start the backend:



```bash

docker compose up

```



Then open another terminal and start the frontend:



```bash

cd frontend

npm run dev

```



Use the following command when Docker images need to be rebuilt after backend or Docker configuration changes:



```bash

docker compose up --build

```



\## Testing



The project includes tests for distributed-system behaviour.



\### Concurrency Testing



Run from the project root:



```bash

node backend/test\_concurrency.js

```



\### Extended Authorization Testing



Run:



```bash

node backend/test\_extended\_authorization.js

```



\## Distributed Systems Concepts Demonstrated



The project demonstrates the following Distributed Systems concepts:



\- Microservices architecture

\- Service-to-service communication

\- Message-based communication

\- RabbitMQ message broker

\- Distributed resource management

\- Concurrent booking handling

\- Booking conflict detection

\- Database persistence

\- Fault isolation

\- Containerization using Docker

\- Role-based authorization



\## Security



Environment files containing passwords or other secrets must never be committed to GitHub.



The repository provides `.env.example` files as templates.



Never commit:



\- `.env` files

\- Passwords

\- API keys

\- Authentication tokens

\- Database credentials

\- Other secrets



\## Environment Files



The actual `.env` files are ignored by Git using `.gitignore`.



When setting up the project on another computer, create your own `.env` files from the provided examples and enter your local configuration.



\## Academic Project



| Item | Details |

|---|---|

| Course | Distributed Systems |

| Project | DistriBook – Distributed Resource Booking System |

| Repository | Distributed-Systems-Distribook |

