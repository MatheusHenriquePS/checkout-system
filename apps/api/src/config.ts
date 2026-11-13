function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function parsePort(raw: string, name: string): number {
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${name}: ${raw}`);
  }
  return port;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid integer: ${raw}`);
  }
  return n;
}

export function loadApiConfig() {
  return {
    host: process.env.API_HOST ?? "0.0.0.0",
    port: parsePort(process.env.API_HOST_PORT ?? "8080", "API_HOST_PORT"),
    nodeEnv: process.env.NODE_ENV ?? "development",
    redisUrl: process.env.REDIS_URL ?? required("REDIS_URL"),
    rabbitmqUrl: process.env.RABBITMQ_URL ?? required("RABBITMQ_URL"),
    checkoutQueueName: process.env.CHECKOUT_QUEUE_NAME ?? "checkout.orders",
    idempotencyTtlSeconds: parsePositiveInt(
      process.env.IDEMPOTENCY_TTL_SECONDS,
      86_400,
    ),
    idempotencyLockSeconds: parsePositiveInt(
      process.env.IDEMPOTENCY_LOCK_SECONDS,
      120,
    ),
  } as const;
}
