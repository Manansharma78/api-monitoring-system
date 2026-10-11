# API Monitoring System

I'm building an API monitoring platform that checks whether APIs are working, tracks their response times, and records failures.

I started this project to get more practical experience with backend development, databases, message queues, and building a complete application.

## What it does

- Checks APIs automatically at regular intervals
- Tracks response times and HTTP status codes
- Detects failed API requests
- Creates incidents when a monitor goes down
- Tracks monitoring history
- Shows monitor status, uptime, and incidents on a dashboard
- Uses a scheduler and background worker to process monitoring jobs

## Tech Stack

- **Frontend:** Next.js, React, TypeScript
- **Backend:** Node.js, Fastify, TypeScript
- **Database:** PostgreSQL, MongoDB
- **ORM:** Prisma
- **Message Queue:** RabbitMQ
- **Infrastructure:** Docker Compose, Redis

## How it works

The scheduler checks which monitors need to run and sends jobs to RabbitMQ. A background worker processes those jobs, checks the target APIs, and stores the results. The dashboard displays the latest status, monitoring history, and incidents.

PostgreSQL stores the application's structured data, while MongoDB stores monitoring check history.

## Running locally

You'll need Node.js, npm, and Docker Desktop installed.

1. Clone the repository:

   ```bash
   git clone https://github.com/Manansharma78/api-monitoring-system.git
   cd api-monitoring-system
   ```

2. Start the Docker services:

   ```bash
   docker compose up -d
   ```

3. Configure the required environment variables in the appropriate application folders. Use your local database and service credentials, and don't commit `.env` files.

4. Install dependencies and start the API, scheduler, monitor worker, and frontend using the scripts configured in their respective folders.

5. Open `http://localhost:3000` to view the dashboard.

## Current status

The first version is working locally. I've tested successful API checks, failure detection, incident creation, and monitor recovery.

I'm still working on the project and plan to improve its testing, alerting, reliability, and deployment.

## Repository

[GitHub – API Monitoring System](https://github.com/Manansharma78/api-monitoring-system)
