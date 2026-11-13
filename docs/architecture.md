# Architecture

Fast checkout HTTP response (`202`) with payment and stock handled out of band.

```
Client
  │  POST /checkout + X-Idempotency-Key
  ▼
┌─────────┐     PENDING      ┌──────────┐
│   API   │ ───────────────► │ Postgres │
└────┬────┘                  └────▲─────┘
     │ publish event              │ status updates
     ▼                            │
┌──────────┐                 ┌────┴─────┐
│ RabbitMQ │ ──────────────► │  Worker  │
│ + DLQ    │                 └────┬─────┘
└──────────┘                      │
                                  ▼
                         simulated gateway
                         circuit breaker
```

**API** (`apps/api`): validate body, Redis idempotency, persist `PENDING`, publish to the queue.

**Worker** (`apps/worker`): consume RabbitMQ, fake payment, decrement stock, ACK/NACK, DLQ when retry is pointless.

`packages/contracts` — shared Zod schemas.  
`packages/database` — Prisma on PostgreSQL.

API and Worker are **two processes** in one pnpm monorepo. You can restart one without the other.

## Local ports (Docker Compose)

- API: `8080`
- Postgres: `8081`
- Redis: `8082`
- RabbitMQ: `8083` (AMQP), `8084` (management UI)

The Worker has no HTTP port.

## Why async

Payment gateways are slow and unreliable. Keeping the client on the HTTP thread for the full flow hurts latency and availability. Queue + Worker isolate that work.

Idempotency and atomic stock updates address duplicate charges and overselling — not “wait longer” on the API.
