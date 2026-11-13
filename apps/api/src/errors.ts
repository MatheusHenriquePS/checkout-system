import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof ZodError) {
      request.log.debug({ issues: error.issues }, "validation failed");
      return reply.code(400).send({
        error: "validation_error",
        message: "Request validation failed",
        issues: error.issues,
      });
    }

    reply.send(error);
  });
}
