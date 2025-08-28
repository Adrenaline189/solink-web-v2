// lib/ratelimit.ts
type Entry = { count: number; resetAt: number };
const BUCKET = new Map<string, Entry>();

export function hit(ip: string, limit = 5, windowMs = 60_000): { ok: boolean; remaining: number } {
  const now = Date.now();
  const cur = BUCKET.get(ip);
  if (!cur || cur.resetAt < now) {
    BUCKET.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }
  if (cur.count >= limit) return { ok: false, remaining: 0 };
  cur.count += 1;
  return { ok: true, remaining: limit - cur.count };
}
