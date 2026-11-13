import { workerLog } from "../log.js";
import { PaymentUnavailableError } from "./gateway-errors.js";

type CircuitState = "closed" | "open" | "half-open";

export type CircuitBreakerOptions = {
  readonly failureThreshold: number;
  readonly cooldownMs: number;
};

/**
 * Stops the worker from hammering an unavailable gateway.
 * closed → failures accumulate; open → fast reject; half-open → single probe.
 */
export class CircuitBreaker {
  private state: CircuitState = "closed";
  private consecutiveFailures = 0;
  private openUntil = 0;

  constructor(private readonly options: CircuitBreakerOptions) {}

  getState(): CircuitState {
    return this.state;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === "open") {
      if (Date.now() < this.openUntil) {
        throw new PaymentUnavailableError("circuit_open");
      }
      this.state = "half-open";
    }

    try {
      const result = await operation();
      if (this.state === "half-open") {
        workerLog("circuit breaker closed (half-open probe succeeded)");
      }
      this.onSuccess();
      return result;
    } catch (err: unknown) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  private onFailure(): void {
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.options.failureThreshold) {
      if (this.state !== "open") {
        workerLog("circuit breaker opened", {
          consecutiveFailures: this.consecutiveFailures,
          cooldownMs: this.options.cooldownMs,
        });
      }
      this.state = "open";
      this.openUntil = Date.now() + this.options.cooldownMs;
    } else if (this.state === "half-open") {
      this.state = "open";
      this.openUntil = Date.now() + this.options.cooldownMs;
    }
  }
}
