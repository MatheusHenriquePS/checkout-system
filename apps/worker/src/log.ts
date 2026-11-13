export function workerLog(
  message: string,
  extra?: Record<string, unknown>,
): void {
  console.log(JSON.stringify({ service: "worker", message, ...extra }));
}
