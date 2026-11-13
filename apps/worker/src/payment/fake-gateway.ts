import { randomUUID } from "node:crypto";
import type { PaymentConfig } from "./config.js";
import { PaymentUnavailableError } from "./gateway-errors.js";
import type { ChargeRequest, ChargeResult, PaymentGateway } from "./types.js";
import { sleep } from "./backoff.js";

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new PaymentUnavailableError("payment_timeout"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err: unknown) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/** Gateway simulado: latência, falha aleatória, timeout e idempotência por orderId. */
export class FakePaymentGateway implements PaymentGateway {
  private readonly approvals = new Map<string, string>();

  constructor(private readonly config: PaymentConfig) {}

  charge(request: ChargeRequest): Promise<ChargeResult> {
    return withTimeout(this.chargeInternal(request), this.config.timeoutMs);
  }

  private async chargeInternal(request: ChargeRequest): Promise<ChargeResult> {
    const existing = this.approvals.get(request.orderId);
    if (existing) {
      return { status: "approved", chargeId: existing };
    }

    if (this.config.simulatedLatencyMs > 0) {
      await sleep(this.config.simulatedLatencyMs);
    }

    if (this.config.failRate > 0 && Math.random() < this.config.failRate) {
      throw new PaymentUnavailableError("payment_gateway_error");
    }

    // ~5% recusa definitiva (cartão recusado) — não vale retry infinito.
    if (Math.random() < 0.05) {
      return { status: "declined", reason: "card_declined" };
    }

    const chargeId = `chg_${randomUUID()}`;
    this.approvals.set(request.orderId, chargeId);
    return { status: "approved", chargeId };
  }
}
