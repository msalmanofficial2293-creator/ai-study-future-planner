import "server-only";

import { createRateLimiter } from "@/lib/security/rate-limit";

const allow = createRateLimiter({ windowMs: 60_000, maxCalls: 10 });

export function allowAiTest(userId: string): boolean {
  return allow(userId);
}
