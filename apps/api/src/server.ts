import { healthResponseSchema } from "@checkout/contracts";
import Fastify from "fastify";
import { loadApiConfig } from "./config.js";
import { createCheckoutPublisher } from "./infra/rabbitmq.js";
import { createRedisClient } from "./infra/redis.js";
import { registerIdempotencyPlugin } from "./plugins/idempotency.js";
import { registerCheckoutRoutes } from "./routes/checkout.js";
import { registerOrderRoutes } from "./routes/orders.js";
import { registerErrorHandler } from "./errors.js";

const config = loadApiConfig();

const app = Fastify({
  logger: {
    level: config.nodeEnv === "production" ? "info" : "debug",
  },
});

const redis = await createRedisClient(config.redisUrl);
const publisher = await createCheckoutPublisher(
  config.rabbitmqUrl,
  config.checkoutQueueName,
);

registerErrorHandler(app);

await registerIdempotencyPlugin(app, {
  redis,
  ttlSeconds: config.idempotencyTtlSeconds,
  lockSeconds: config.idempotencyLockSeconds,
});

app.get("/health", async () => {
  const body = healthResponseSchema.parse({
    status: "ok",
    service: "api",
  });
  return body;
});

await registerCheckoutRoutes(app, { publisher });
await registerOrderRoutes(app);

app.addHook("onClose", async () => {
  await publisher.close();
  await redis.quit();
});

async function main() {
  await app.listen({ port: config.port, host: config.host });
  app.log.info(`API listening on http://${config.host}:${config.port}`);
}

main().catch((err: unknown) => {
  app.log.error(err);
  process.exit(1);
});
