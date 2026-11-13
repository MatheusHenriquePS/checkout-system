import type { Channel } from "amqplib";
import {
  CHECKOUT_DLQ_NAME,
  CHECKOUT_DLQ_ROUTING_KEY,
  CHECKOUT_DLX,
  CHECKOUT_QUEUE_NAME,
} from "./queues.js";

/**
 * Asserts main queue + DLQ. API and Worker must use the same arguments.
 * If a queue already exists with different args, delete it in RabbitMQ UI and recreate.
 */
export async function assertCheckoutTopology(
  channel: Channel,
  mainQueueName = CHECKOUT_QUEUE_NAME,
): Promise<void> {
  await channel.assertExchange(CHECKOUT_DLX, "direct", { durable: true });
  await channel.assertQueue(CHECKOUT_DLQ_NAME, { durable: true });
  await channel.bindQueue(CHECKOUT_DLQ_NAME, CHECKOUT_DLX, CHECKOUT_DLQ_ROUTING_KEY);

  await channel.assertQueue(mainQueueName, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": CHECKOUT_DLX,
      "x-dead-letter-routing-key": CHECKOUT_DLQ_ROUTING_KEY,
    },
  });
}
