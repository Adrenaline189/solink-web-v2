// lib/redis.ts
import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis() {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    console.log("[worker][redis] connecting to", url);   // <- เพิ่มบรรทัดนี้
    if (!url) throw new Error("Missing REDIS_URL");
    _redis = new Redis(url, {
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
    });
  }
  return _redis;
}
