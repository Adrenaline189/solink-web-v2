// lib/redis.ts
import Redis from "ioredis";

let _redis: Redis | null = null;

export function getRedis() {
  if (!_redis) {
    const url = process.env.REDIS_URL;
    if (!url) throw new Error("Missing REDIS_URL");
    _redis = new Redis(url, {
      // ข้อกำหนดของ BullMQ
      maxRetriesPerRequest: null,
      enableReadyCheck: true,
      lazyConnect: false,
      // (ถ้าเป็น rediss:// Upstash จะ TLS ให้อัตโนมัติ)
    });
  }
  return _redis;
}
