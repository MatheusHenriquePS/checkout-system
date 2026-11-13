import { z } from "zod";

/** Resposta padrão de healthcheck — API e Worker podem estender depois. */
export const healthResponseSchema = z.object({
  status: z.literal("ok"),
  service: z.enum(["api", "worker"]),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
