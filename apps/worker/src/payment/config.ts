function parseNonNegativeInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error(`Invalid non-negative integer: ${raw}`);
  }
  return n;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isInteger(n) || n < 1) {
    throw new Error(`Invalid positive integer: ${raw}`);
  }
  return n;
}

function parseRate(raw: string | undefined, fallback: number): number {
  if (raw === undefined) {
    return fallback;
  }
  const n = Number.parseFloat(raw);
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    throw new Error(`Invalid rate (0–1): ${raw}`);
  }
  return n;
}

export type PaymentConfig = {
  readonly simulatedLatencyMs: number;
  readonly failRate: number;
  readonly timeoutMs: number;
  readonly maxAttempts: number;
  readonly backoffBaseMs: number;
  readonly backoffMaxMs: number;
  readonly circuitFailureThreshold: number;
  readonly circuitCooldownMs: number;
};

export function loadPaymentConfig(): PaymentConfig {
  return {
    simulatedLatencyMs: parseNonNegativeInt(process.env.PAYMENT_SIMULATED_LATENCY_MS, 150),
    failRate: parseRate(process.env.PAYMENT_FAIL_RATE, 0.15),
    timeoutMs: parsePositiveInt(process.env.PAYMENT_TIMEOUT_MS, 5_000),
    maxAttempts: parsePositiveInt(process.env.PAYMENT_MAX_ATTEMPTS, 4),
    backoffBaseMs: parsePositiveInt(process.env.PAYMENT_BACKOFF_BASE_MS, 500),
    backoffMaxMs: parsePositiveInt(process.env.PAYMENT_BACKOFF_MAX_MS, 15_000),
    circuitFailureThreshold: parsePositiveInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD, 5),
    circuitCooldownMs: parsePositiveInt(process.env.CIRCUIT_BREAKER_COOLDOWN_MS, 30_000),
  };
}
