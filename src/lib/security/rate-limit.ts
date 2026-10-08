import "server-only";

type Bucket = Map<string, number[]>;

/**
 * In-process sliding window. Suitable for a single Node instance during free development.
 * Staging and production with multiple instances still need a shared limiter.
 */
export function createRateLimiter(options: {
  windowMs: number;
  maxCalls: number;
  maxKeys?: number;
}) {
  const calls: Bucket = new Map();
  const maxKeys = options.maxKeys ?? 2_000;

  return function allow(key: string): boolean {
    const id = key.trim().toLowerCase();

    if (!id) {
      return false;
    }

    const now = Date.now();
    const recent = (calls.get(id) ?? []).filter((time) => now - time < options.windowMs);

    if (recent.length >= options.maxCalls) {
      calls.set(id, recent);
      return false;
    }

    recent.push(now);
    calls.set(id, recent);
    prune(calls, now, options.windowMs, maxKeys);
    return true;
  };
}

function prune(calls: Bucket, now: number, windowMs: number, maxKeys: number) {
  if (calls.size < maxKeys) {
    return;
  }

  for (const [key, times] of calls) {
    if (times.every((time) => now - time >= windowMs)) {
      calls.delete(key);
    }
  }
}
