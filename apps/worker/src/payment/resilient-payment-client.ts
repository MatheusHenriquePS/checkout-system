import { TransientProcessingError } from "../errors.js";
import { computeBackoffMs, sleep } from "./backoff.js";
import { CircuitBreaker } from "./circuit-breaker.js";
import type { PaymentConfig } from "./config.js";
import { FakePaymentGateway } from "./fake-gateway.js";
import { isPaymentUnavailableError } from "./gateway-errors.js";
import type { ChargeRequest, ChargeResult } from "./types.js";

export type ResilientPaymentClient = {
  charge(request: ChargeRequest): Promise<ChargeResult>;
  circuitState(): string;
};

export function createResilientPaymentClient(
  config: PaymentConfig,
): ResilientPaymentClient {
  const gateway = new FakePaymentGateway(config);
  const breaker = new CircuitBreaker({
    failureThreshold: config.circuitFailureThreshold,
    cooldownMs: config.circuitCooldownMs,
  });

  return {
    circuitState: () => breaker.getState(),

    async charge(request: ChargeRequest): Promise<ChargeResult> {
      for (let attempt = 1; attempt <= config.maxAttempts; attempt += 1) {
        try {
          return await breaker.execute(() => gateway.charge(request));
        } catch (err: unknown) {
          const retryable = isPaymentUnavailableError(err);
          const isLast = attempt >= config.maxAttempts;

          if (!retryable || isLast) {
            if (retryable) {
              throw new TransientProcessingError(
                `payment_retries_exhausted:${request.orderId}`,
                { cause: err },
              );
            }
            throw err;
          }

          const delayMs = computeBackoffMs(
            attempt,
            config.backoffBaseMs,
            config.backoffMaxMs,
          );
          await sleep(delayMs);
        }
      }

      throw new TransientProcessingError(
        `payment_retries_exhausted:${request.orderId}`,
      );
    },
  };
}
