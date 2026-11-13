/** Erro que não deve retentar — mensagem vai para DLQ (nack sem requeue). */
export class PermanentProcessingError extends Error {
  readonly permanent = true;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PermanentProcessingError";
  }
}

/**
 * Falha transitória após retries no Worker — pedido permanece PENDING; fila faz requeue.
 */
export class TransientProcessingError extends Error {
  readonly transient = true;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "TransientProcessingError";
  }
}

export function isPermanentError(err: unknown): boolean {
  return err instanceof PermanentProcessingError;
}

export function isTransientError(err: unknown): boolean {
  return err instanceof TransientProcessingError;
}
