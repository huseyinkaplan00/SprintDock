# SprintDock

SprintDock is a portfolio-grade realtime work coordination application built by Huseyin Kaplan. It ships as a JavaScript monorepo with an Express API, background worker, React client, and shared UI package.

## Highlights

- OTP-based authentication flow with JWT access/refresh token rotation
- End-to-end CRUD flows for projects, tasks, comments, and sessions
- RabbitMQ-backed event publishing and worker consumption pipeline
- Socket.io project rooms for realtime task and comment updates
- Reusable `packages/ui` component library shared across the frontend
- Local Docker setup plus cloud deployment support for Vercel and Render

## Architecture

- `apps/api` - Express REST API, auth/session flows, Rabbit publishers, Socket.io server
- `apps/worker` - Rabbit consumers, notifier/analytics handlers, internal realtime bridge
- `apps/web` - React + Vite client using TanStack Query, Zustand, and socket invalidation
- `packages/ui` - shared UI primitives, tables, dialogs, dropdowns, toasts
- `packages/common` - shared constants and schemas

## Stack

- Node.js
- Express
- React + Vite
- MongoDB + Mongoose
- Redis
- RabbitMQ
- Socket.io
- pnpm workspaces

## Local Setup

Requirements:

- Node.js 20+
- pnpm 10+
- Docker + Docker Compose

Install and verify:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

Run in development:

```bash
pnpm dev
```

Default local addresses:

- API: `http://localhost:4000`
- Web: `http://localhost:5173`
- RabbitMQ UI: `http://localhost:15672`

## Docker

```bash
docker compose up -d --build
docker compose ps
curl -i http://localhost:4000/health
```

## Environment Variables

Use `.env.example` as the starting point.

Core variables:

- `MONGO_URI`
- `REDIS_URL`
- `RABBIT_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `INTERNAL_API_KEY`
- `API_INTERNAL_URL`
- `VITE_API_URL`
- `VITE_SOCKET_URL`

Notes:

- URL-encode MongoDB passwords when they contain special characters.
- `OTP_ECHO=true` is a demo-only switch and should stay disabled in real production environments.

## Live Demo

- Frontend: `https://sprintdock-huseyinkaplan.vercel.app`
- API health: `https://sprintdock-api.onrender.com/health`
- Worker health: `https://sprintdock-worker.onrender.com/health`

## Cloud Deployment

### Vercel

The frontend is configured with `vercel.json`.

Required environment variables:

- `VITE_API_URL=https://<api-domain>`
- `VITE_SOCKET_URL=https://<api-domain>`

### Render

`render.yaml` contains the baseline service configuration for both the API and the worker.

API env set:

- `NODE_ENV=production`
- `PORT=10000`
- `MONGO_URI=<atlas-uri>`
- `REDIS_URL=<upstash-uri>`
- `RABBIT_URL=<cloudamqp-uri>`
- `JWT_SECRET=<secret>`
- `JWT_REFRESH_SECRET=<secret>`
- `CORS_ORIGINS=https://<your-vercel-domain>`
- `INTERNAL_API_KEY=<shared-secret>`
- `OTP_ECHO=true` only for demo environments

Worker env set:

- `NODE_ENV=production`
- `MONGO_URI=<atlas-uri>`
- `REDIS_URL=<upstash-uri>`
- `RABBIT_URL=<cloudamqp-uri>`
- `INTERNAL_API_KEY=<shared-secret>`
- `API_INTERNAL_URL=https://<api-domain>/internal/realtime`

## Verification

Health check:

```bash
curl -i https://<api-domain>/health
```

Request OTP:

```bash
curl -X POST https://<api-domain>/api/auth/request-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com"}'
```

Verify OTP:

```bash
curl -X POST https://<api-domain>/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","otp":"123456"}'
```

Smoke flow:

- `POST /api/projects`
- `GET /api/projects`
- `POST /api/tasks`
- `GET /api/tasks?projectId=...`
- `POST /api/comments`

Event checks:

- Worker logs should show `task_created`, `task_assigned`, `comment_added`
- Socket listeners should receive `task.updated` and `comment.added`

## Quality Gate

- `pnpm lint`
- `pnpm test`
- `pnpm build`
- `docker compose up -d --build`
- `pnpm --filter @sprintdock/web test:e2e`

## Documentation

- ADRs: `docs/ADRs`
- Realtime flow: `docs/architecture/realtime-flow.svg`
- ERD: `docs/ERD/sprintdock-erd.svg`
- Postman collection: `docs/postman/SprintDock.postman_collection.json`
- Improvement log: `docs/uygulanan-iyilestirmeler.md`

## Usage Note

This repository is intended for portfolio and technical demonstration purposes. Before using it in a real production setting, rotate all secrets, replace demo OTP delivery with a proper messaging channel, and review service plans and operational safeguards.
