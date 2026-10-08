import "server-only";

import { createRateLimiter } from "@/lib/security/rate-limit";

/** Tutor sends per signed-in student, per minute, on this server instance. */
const allowSend = createRateLimiter({ windowMs: 60_000, maxCalls: 20 });

export function allowTutorSend(userId: string): boolean {
  return allowSend(userId);
}
