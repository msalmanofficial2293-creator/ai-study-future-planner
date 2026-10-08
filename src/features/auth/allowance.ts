import "server-only";

import { createRateLimiter } from "@/lib/security/rate-limit";

/** Login and signup attempts per email, per minute, on this server instance. */
const allowAttempt = createRateLimiter({ windowMs: 60_000, maxCalls: 10 });

export function allowAuthAttempt(email: string): boolean {
  return allowAttempt(email);
}
