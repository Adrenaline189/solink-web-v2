// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

function csp() {
  // NOTE: มี inline script ตัวตั้งธีม => อนุโลม 'unsafe-inline'
  // ถ้าอยากเข้มขึ้น ใช้ CSP hash/nonce แทนในภายหลัง
  const base = [
    "default-src 'self'",
    `script-src 'self' ${isProd ? "" : "'unsafe-eval'"} 'unsafe-inline' https://vitals.vercel-insights.com https://vercel.live`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://vitals.vercel-insights.com",
    "font-src 'self' data:",
    "connect-src 'self' https://vitals.vercel-insights.com https://vercel.live ws: wss:",
    "frame-ancestors 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].filter(Boolean);
  return base.join("; ");
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // เพิ่ม Security Headers
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    // ปิดสิทธิ์ส่วนใหญ่ (ปรับตามฟีเจอร์ที่ใช้)
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  );
  res.headers.set("Content-Security-Policy", csp());

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|og|api/og).*)"],
};
