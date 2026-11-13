import { type CheckoutRequestedEvent } from "@checkout/contracts";
import {
  decrementStockIfAvailable,
  OrderFailureReason,
  OrderStatus,
  prisma,
} from "@checkout/database";
import { PermanentProcessingError } from "./errors.js";
import { loadPaymentConfig } from "./payment/config.js";
import { createResilientPaymentClient } from "./payment/resilient-payment-client.js";
import { workerLog } from "./log.js";

const paymentClient = createResilientPaymentClient(loadPaymentConfig());

function computeOrderAmountCents(
  items: Array<{ quantity: number; product: { priceCents: number } }>,
): number {
  return items.reduce(
    (sum, item) => sum + item.product.priceCents * item.quantity,
    0,
  );
}

export async function processCheckoutRequest(
  event: CheckoutRequestedEvent,
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: event.orderId },
    include: {
      items: {
        include: { product: { select: { priceCents: true } } },
      },
    },
  });

  if (!order) {
    throw new PermanentProcessingError(`order_not_found:${event.orderId}`);
  }

  if (order.status !== OrderStatus.PENDING) {
    return;
  }

  if (order.items.length === 0) {
    throw new PermanentProcessingError(`order_has_no_items:${event.orderId}`);
  }

  const amountCents = computeOrderAmountCents(order.items);

  const payment = await paymentClient.charge({
    orderId: order.id,
    amountCents,
    customerEmail: order.customerEmail,
  });

  if (payment.status === "declined") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.FAILED,
        failureReason: OrderFailureReason.PAYMENT_DECLINED,
        failureDetail: payment.reason,
      },
    });
    workerLog("payment declined", {
      orderId: order.id,
      reason: payment.reason,
      circuit: paymentClient.circuitState(),
    });
    return;
  }

  const paid = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      const updated = await decrementStockIfAvailable(
        tx,
        item.productId,
        item.quantity,
      );
      if (updated === 0) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: OrderStatus.FAILED,
            failureReason: OrderFailureReason.INSUFFICIENT_STOCK_AFTER_PAYMENT,
            failureDetail: `product_id=${item.productId}, quantity=${item.quantity}`,
          },
        });
        workerLog("insufficient stock after payment", {
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          chargeId: payment.chargeId,
        });
        return false;
      }
    }

    await tx.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        failureReason: null,
        failureDetail: null,
      },
    });
    return true;
  });

  if (paid) {
    workerLog("checkout paid", {
      orderId: order.id,
      chargeId: payment.chargeId,
      amountCents,
      circuit: paymentClient.circuitState(),
    });
  }
}
