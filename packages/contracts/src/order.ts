import { z } from "zod";

export const orderFailureReasonSchema = z.enum([
  "PAYMENT_DECLINED",
  "INSUFFICIENT_STOCK_AFTER_PAYMENT",
]);

export const orderStatusSchema = z.enum(["PENDING", "PAID", "FAILED"]);

export const orderResponseSchema = z.object({
  orderId: z.string().uuid(),
  status: orderStatusSchema,
  customerEmail: z.string().email(),
  failureReason: orderFailureReasonSchema.nullable(),
  failureDetail: z.string().nullable(),
});

export type OrderFailureReason = z.infer<typeof orderFailureReasonSchema>;
export type OrderResponse = z.infer<typeof orderResponseSchema>;
