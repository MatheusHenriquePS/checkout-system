import { z } from "zod";
import { checkoutItemSchema } from "../checkout.js";

/** Event published by the API after persisting a PENDING order. */
export const checkoutRequestedEventSchema = z.object({
  orderId: z.string().uuid(),
  customerEmail: z.string().email(),
  items: z.array(checkoutItemSchema).min(1),
});

export type CheckoutRequestedEvent = z.infer<typeof checkoutRequestedEventSchema>;
