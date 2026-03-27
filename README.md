# GIF-Mood

GIF-Mood is a full-stack app for posting mood GIFs, searching GIFs through GIPHY, uploading local media, and sharing timelines with expiring links.

## Stack

- Frontend: React + TypeScript + Vite + Bootstrap
- Backend: Fastify + TypeScript + Prisma
- Database: PostgreSQL
- Runtime: Docker + Docker Compose

## Project Structure

- frontend: React application
- backend: Fastify API and Prisma schema
- uploads: persisted uploaded media files
- docker-compose.yml: local multi-service orchestration

## Prerequisites

- Docker
- Docker Compose

## Quick Start With Docker

1. Clone the repository and enter the folder.
2. Create backend environment file from template:

```bash
cp backend/.env.example backend/.env
```

3. Open backend/.env and set a strong JWT_SECRET and a valid GIPHY_API_KEY.

4. Start services:

```bash
docker compose up --build
```

5. Access services:
- Backend API: http://localhost:3000
- Frontend (if running separately): http://localhost:5173
- Health check: http://localhost:3000/health

## Docker Services

The compose stack starts:

- postgres: PostgreSQL database
- prisma-push: applies Prisma schema to database
- backend: Fastify API

Uploaded files are persisted through the local uploads directory mounted into the backend container.

## Environment Variables (Backend)

Defined in backend/.env.example:

- DATABASE_URL
- JWT_SECRET
- GIPHY_API_KEY
- UPLOAD_DIR
- PORT
- CORS_ORIGIN
- RATE_LIMIT_MAX
- RATE_LIMIT_TIME_WINDOW
- RATE_LIMIT_BAN_AFTER

## Optional Local Development (Without Docker)

Backend:

```bash
cd backend
npm install
npm run build
npm test
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Contributing (Fork Workflow)

1. Fork the repository on GitHub.
2. Clone your fork locally.
3. Create a feature branch from main:

```bash
git checkout -b feat/short-description
```

4. Make your changes and run checks:

```bash
# backend checks
cd backend
npm run build
npm test

# frontend checks
cd ../frontend
npm run build
```

5. Commit using clear messages:

```bash
git add .
git commit -m "feat: short summary of change"
```

6. Push your branch to your fork:

```bash
git push origin feat/short-description
```

7. Open a Pull Request from your fork branch to the upstream main branch.

## License

This project is licensed under the MIT License. See LICENSE for details.
