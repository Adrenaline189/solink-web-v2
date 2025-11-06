// lib/env.ts
const readRuntimeVar = (key: string): string | undefined => {
  // 1) window runtime (ถ้าอยากตั้งจาก <script> ใส่ลง window)
  if (typeof window !== "undefined" && (window as any)[key]) {
    return String((window as any)[key]);
  }
  // 2) Next public env (SSR/Edge เท่านั้น)
  if (typeof process !== "undefined") {
    const v = (process as any).env?.[key];
    if (v) return String(v);
  }
  return undefined;
};

const FALLBACK_API = "https://api-solink.network";

// ระวัง: client ห้ามอ้าง process ตรง ๆ ตอน import/time
export const API_BASE =
  readRuntimeVar("NEXT_PUBLIC_API_BASE") ||
  // ถ้าเรียกจากเบราว์เซอร์ ให้ใช้ origin + /api เป็น proxy ทันที
  (typeof window !== "undefined"
    ? `${window.location.origin}`
    : FALLBACK_API);
