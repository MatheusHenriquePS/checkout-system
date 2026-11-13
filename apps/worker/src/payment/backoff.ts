export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Tentativa 1-based; jitter leve para evitar thundering herd. */
export function computeBackoffMs(
  attempt: number,
  baseMs: number,
  maxMs: number,
): number {
  const exponential = Math.min(maxMs, baseMs * 2 ** (attempt - 1));
  const jitter = Math.floor(Math.random() * Math.min(exponential * 0.2, 500));
  return exponential + jitter;
}
