import { assertCheckoutTopology } from "@checkout/messaging";
import amqp from "amqplib";

export type CheckoutPublisher = {
  publishCheckoutRequested(payload: string): Promise<void>;
  close(): Promise<void>;
};

export async function createCheckoutPublisher(
  url: string,
  queueName: string,
): Promise<CheckoutPublisher> {
  const connection = await amqp.connect(url);
  const channel = await connection.createChannel();
  await assertCheckoutTopology(channel, queueName);

  return {
    publishCheckoutRequested: async (payload: string) => {
      const sent = channel.sendToQueue(queueName, Buffer.from(payload), {
        persistent: true,
        contentType: "application/json",
      });
      if (!sent) {
        throw new Error("RabbitMQ sendToQueue buffer full");
      }
    },
    close: async () => {
      await channel.close();
      await connection.close();
    },
  };
}
