// lib/rate-limit.ts
const buckets = new Map<string, { ts: number[] }>();

export function rateLimit(key: string, limitPerMin = 30) {
  const now = Date.now();
  const windowMs = 60_000;
  const b = buckets.get(key) ?? { ts: [] };
  b.ts = b.ts.filter(t => now - t < windowMs);
  if (b.ts.length >= limitPerMin) {
    const e = new Error("Too Many Requests");
    // @ts-ignore
    e.status = 429;
    throw e;
  }
  b.ts.push(now);
  buckets.set(key, b);
}
