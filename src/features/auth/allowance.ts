import "server-only";

import { createRateLimiter } from "@/lib/security/rate-limit";

/** Login and signup attempts per email, per minute, on this server instance. */
const allowAttempt = createRateLimiter({ windowMs: 60_000, maxCalls: 10 });

/** Verification email resends per email, per five minutes, on this server instance. */
const allowResend = createRateLimiter({ windowMs: 5 * 60_000, maxCalls: 3 });

export function allowAuthAttempt(email: string): boolean {
  return allowAttempt(email);
}

export function allowVerificationResend(email: string): boolean {
  return allowResend(email);
}
