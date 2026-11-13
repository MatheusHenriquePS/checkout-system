import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive().max(100),
});

export const checkoutRequestSchema = z.object({
  customerEmail: z.string().email(),
  items: z.array(checkoutItemSchema).min(1).max(10),
});

export const checkoutAcceptedResponseSchema = z.object({
  orderId: z.string().uuid(),
  status: z.literal("PENDING"),
});

export type CheckoutItem = z.infer<typeof checkoutItemSchema>;
export type CheckoutRequest = z.infer<typeof checkoutRequestSchema>;
export type CheckoutAcceptedResponse = z.infer<
  typeof checkoutAcceptedResponseSchema
>;
