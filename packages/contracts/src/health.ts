import { z } from "zod";

/** Default healthcheck response — API and Worker may extend later. */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.enum(["api", "worker"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
