import "server-only";

/**
 * Server diagnostics for database and provider failures.
 * Production logs a step and error code only. Provider messages stay off the wire and out of production logs.
 */
export function logServerDiagnostic(
  scope: string,
  step: string,
  error: { code?: string; message?: string } | null | undefined,
): void {
  if (!error) {
    console.error(`[${scope}:${step}] failed`);
    return;
  }

  const code = typeof error.code === "string" && error.code.trim() ? error.code.trim() : "none";

  if (process.env.NODE_ENV === "production") {
    console.error(`[${scope}:${step}] ${code}`);
    return;
  }

  const detail =
    typeof error.message === "string" && error.message.trim().length > 0
      ? error.message.trim().slice(0, 240)
      : "none";
  console.error(`[${scope}:${step}] ${code}: ${detail}`);
}
