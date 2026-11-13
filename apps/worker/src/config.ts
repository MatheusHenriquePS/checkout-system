function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
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

export function loadWorkerConfig() {
  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    rabbitmqUrl: process.env.RABBITMQ_URL ?? required("RABBITMQ_URL"),
    checkoutQueueName: process.env.CHECKOUT_QUEUE_NAME ?? "checkout.orders",
    prefetchCount: parsePositiveInt(process.env.WORKER_PREFETCH, 1),
  } as const;
}
