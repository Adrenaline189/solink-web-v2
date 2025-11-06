// lib/env.ts
// อ่านค่า API_BASE แบบปลอดภัยบน client (ไม่มีการแตะ process ตรง ๆ)
export const API_BASE: string = (() => {
  // inline จาก NEXT_PUBLIC_* ตอน build (ถ้ามี)
  const fromBuild =
    typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_API_BASE
      ? (process as any).env.NEXT_PUBLIC_API_BASE
      : undefined;

  // runtime override ผ่าน window.__ENV (ถ้าอยากเซ็ตจาก <script> ฝั่ง client)
  const fromWindow =
    typeof window !== "undefined" && (window as any).__ENV?.NEXT_PUBLIC_API_BASE
      ? (window as any).__ENV.NEXT_PUBLIC_API_BASE
      : undefined;

  // สำรองเผื่อรันฝั่ง server เท่านั้น
  const fromServer =
    typeof process !== "undefined" && (process as any).env?.API_BASE
      ? (process as any).env.API_BASE
      : undefined;

  return fromBuild || fromWindow || fromServer || "https://api-solink.network";
})();
