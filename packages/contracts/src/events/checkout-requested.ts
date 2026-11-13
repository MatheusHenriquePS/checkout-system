import { z } from "zod";
import { checkoutItemSchema } from "../checkout.js";

/** Mensagem publicada pela API após gravar pedido PENDING. */
export const checkoutRequestedEventSchema = z.object({
  orderId: z.string().uuid(),
  customerEmail: z.string().email(),
  items: z.array(checkoutItemSchema).min(1),
});

export type CheckoutRequestedEvent = z.infer<typeof checkoutRequestedEventSchema>;
