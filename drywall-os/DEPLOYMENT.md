# Deployment

Drywall OS is self-hostable on a Dell PowerEdge or any container host that can run PostgreSQL 16, Redis, and the Next.js app.

## Required Services

- Next.js app container
- Worker container
- PostgreSQL 16
- Redis
- Private upload volume
- TLS reverse proxy

## Production Compose

Create `.env` from `.env.example`, then run:

```bash
docker compose -f docker/docker-compose.prod.yml up --build -d
```

Apply migrations:

```bash
docker compose -f docker/docker-compose.prod.yml exec app npx prisma migrate deploy
```

Seed plans and operator account:

```bash
docker compose -f docker/docker-compose.prod.yml exec app npm run prisma:seed
```

## Health Check

```text
GET /api/health
```

The health endpoint checks database connectivity and returns a timestamp.

## Storage

Set:

```text
PRIVATE_UPLOAD_ROOT=./.storage/uploads
```

In production this path should be mounted to encrypted persistent storage. The storage adapter is centralized in `lib/files/storage.ts` so S3-compatible storage can be added later without changing feature modules.

## Billing

Plans are defined in code and seeded into the database. V1 uses manual subscription management through the operator console shape. Stripe can be added by implementing the `BillingProvider` interface in `lib/services/billing.ts`.

## Background Jobs

The worker uses BullMQ and Redis. The first milestone registers the worker and queue connection; PDF/email and report jobs can be moved into the queue as volume grows.
