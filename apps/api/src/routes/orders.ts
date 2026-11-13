import { orderResponseSchema } from "@checkout/contracts";
import { prisma } from "@checkout/database";
import type { FastifyInstance } from "fastify";

export async function registerOrderRoutes(app: FastifyInstance): Promise<void> {
  app.get<{ Params: { orderId: string } }>(
    "/orders/:orderId",
    async (request, reply) => {
      const { orderId } = request.params;

      const order = await prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          customerEmail: true,
          failureReason: true,
          failureDetail: true,
        },
      });

      if (!order) {
        return reply.code(404).send({
          error: "order_not_found",
          message: "Order does not exist.",
        });
      }

      const body = orderResponseSchema.parse({
        orderId: order.id,
        status: order.status,
        customerEmail: order.customerEmail,
        failureReason: order.failureReason,
        failureDetail: order.failureDetail,
      });

      return reply.code(200).send(body);
    },
  );
}
