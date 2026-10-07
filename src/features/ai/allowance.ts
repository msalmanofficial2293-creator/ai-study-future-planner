import "server-only";

const WINDOW_MS = 60_000;
const MAX_CALLS = 10;
const calls = new Map<string, number[]>();

export function allowAiTest(userId: string): boolean {
  const now = Date.now();
  const recent = (calls.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);

  if (recent.length >= MAX_CALLS) {
    calls.set(userId, recent);
    return false;
  }

  recent.push(now);
  calls.set(userId, recent);
  pruneExpired(now);
  return true;
}

function pruneExpired(now: number) {
  if (calls.size < 500) {
    return;
  }

  for (const [userId, times] of calls) {
    if (times.every((time) => now - time >= WINDOW_MS)) {
      calls.delete(userId);
    }
  }
}
