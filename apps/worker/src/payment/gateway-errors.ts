/** Falha transitória — rede, timeout, 503, circuit open; vale retry/backoff. */
export class PaymentUnavailableError extends Error {
  constructor(message = "payment_unavailable") {
    super(message);
    this.name = "PaymentUnavailableError";
  }
}

export function isPaymentUnavailableError(err: unknown): boolean {
  return err instanceof PaymentUnavailableError;
}
