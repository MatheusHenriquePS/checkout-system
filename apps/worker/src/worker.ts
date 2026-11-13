import { checkoutRequestedEventSchema } from "@checkout/contracts";
import { assertCheckoutTopology, CHECKOUT_DLQ_NAME } from "@checkout/messaging";
import amqp, { type ConsumeMessage } from "amqplib";
import { isPermanentError, isTransientError } from "./errors.js";
import { loadWorkerConfig } from "./config.js";
import { processCheckoutRequest } from "./process-checkout.js";
import { prisma } from "@checkout/database";
import { workerLog } from "./log.js";

const config = loadWorkerConfig();

async function handleMessage(
  channel: amqp.Channel,
  message: ConsumeMessage,
): Promise<void> {
  const raw = message.content.toString();

  let event;
  try {
    const json: unknown = JSON.parse(raw);
    event = checkoutRequestedEventSchema.parse(json);
  } catch (err: unknown) {
    workerLog("invalid message payload — sending to DLQ", {
      error: err instanceof Error ? err.message : String(err),
    });
    channel.nack(message, false, false);
    return;
  }

  try {
    await processCheckoutRequest(event);
    channel.ack(message);
    workerLog("checkout processed", { orderId: event.orderId });
  } catch (err: unknown) {
    if (isPermanentError(err)) {
      workerLog("permanent failure — DLQ", {
        orderId: event.orderId,
        error: err instanceof Error ? err.message : String(err),
      });
      channel.nack(message, false, false);
      return;
    }

    const reason = err instanceof Error ? err.message : String(err);
    if (isTransientError(err)) {
      workerLog("transient failure — requeue (order stays PENDING)", {
        orderId: event.orderId,
        error: reason,
      });
    } else {
      workerLog("unexpected failure — requeue", {
        orderId: event.orderId,
        error: reason,
      });
    }
    channel.nack(message, false, true);
  }
}

async function main() {
  workerLog("starting");
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  await assertCheckoutTopology(channel, config.checkoutQueueName);
  await channel.prefetch(config.prefetchCount);

  workerLog("consuming", {
    queue: config.checkoutQueueName,
    dlq: CHECKOUT_DLQ_NAME,
    prefetch: config.prefetchCount,
    manualAck: true,
  });

  const { consumerTag } = await channel.consume(
    config.checkoutQueueName,
    (message) => {
      if (!message) {
        return;
      }
      void handleMessage(channel, message).catch((err: unknown) => {
        workerLog("unhandled handler error", {
          error: err instanceof Error ? err.message : String(err),
        });
        channel.nack(message, false, false);
      });
    },
    { noAck: false },
  );

  const shutdown = async (signal: string) => {
    workerLog("shutdown", { signal });
    try {
      await channel.cancel(consumerTag);
      await channel.close();
      await connection.close();
      await prisma.$disconnect();
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err: unknown) => {
  workerLog("fatal error", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
