/** Non-retryable error — message goes to DLQ (nack without requeue). */
export class PermanentProcessingError extends Error {
  readonly permanent = true;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PermanentProcessingError";
  }
}

/**
 * Transient failure after worker retries — order stays PENDING; queue requeues.
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
