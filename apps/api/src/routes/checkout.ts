import {
  checkoutAcceptedResponseSchema,
  checkoutRequestSchema,
  checkoutRequestedEventSchema,
} from "@checkout/contracts";
import { OrderStatus, prisma } from "@checkout/database";
import type { FastifyInstance } from "fastify";
import { randomUUID } from "node:crypto";
import type { CheckoutPublisher } from "../infra/rabbitmq.js";

export type CheckoutRouteDeps = {
  publisher: CheckoutPublisher;
};

export async function registerCheckoutRoutes(
  app: FastifyInstance,
  deps: CheckoutRouteDeps,
): Promise<void> {
  app.post(
    "/checkout",
    {
      config: { idempotency: true },
    },
    async (request, reply) => {
      const body = checkoutRequestSchema.parse(request.body);
      const orderId = randomUUID();

      const productIds = [...new Set(body.items.map((i) => i.productId))];
      const existingProducts = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: { id: true },
      });
      if (existingProducts.length !== productIds.length) {
        return reply.code(404).send({
          error: "product_not_found",
          message: "One or more products do not exist.",
        });
      }

      const order = await prisma.$transaction(async (tx) => {
        return tx.order.create({
          data: {
            id: orderId,
            customerEmail: body.customerEmail,
            status: OrderStatus.PENDING,
            items: {
              create: body.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
              })),
            },
          },
        });
      });

      const event = checkoutRequestedEventSchema.parse({
        orderId: order.id,
        customerEmail: order.customerEmail,
        items: body.items,
      });

      try {
        await deps.publisher.publishCheckoutRequested(JSON.stringify(event));
      } catch (err: unknown) {
        await prisma.order.delete({ where: { id: order.id } });
        request.log.error({ err, orderId: order.id }, "failed to publish checkout event");
        return reply.code(503).send({
          error: "queue_unavailable",
          message: "Could not enqueue checkout for processing.",
        });
      }

      const response = checkoutAcceptedResponseSchema.parse({
        orderId: order.id,
        status: "PENDING",
      });

      request.log.info(
        { customerEmail: body.customerEmail, orderId: order.id, items: body.items.length },
        "checkout accepted",
      );

      return reply.code(202).send(response);
    },
  );
}
