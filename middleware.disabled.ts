// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const isProd = process.env.NODE_ENV === "production";

/** สร้าง Content-Security-Policy
 * - อนุญาต 'unsafe-inline' เพราะมี inline script ตั้งธีม (ลดได้ภายหลังด้วย nonce/hash)
 * - เปิด 'unsafe-eval' เฉพาะ dev เพื่อรองรับ tooling ต่างๆ
 * - รองรับ vercel.live และ vitals.vercel-insights.com ตามที่ Vercel ใช้งานจริง
 */
function buildCsp() {
  const parts = [
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
    "upgrade-insecure-requests",
  ].filter(Boolean);

  return parts.join("; ");
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  /* -----------------------------------------------------------------------
   * 1) Auth protect สำหรับ /dashboard และ /api/dashboard/*
   * --------------------------------------------------------------------- */
  const isProtectedDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isProtectedApi = pathname.startsWith("/api/dashboard/");
  const isProtected = isProtectedDashboard || isProtectedApi;

  if (isProtected) {
    const token = req.cookies.get("solink_auth")?.value;

    // ถ้าไม่มี cookie เลย → block
    if (!token) {
      // ถ้าเป็น API → ตอบ JSON 401
      if (isProtectedApi) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized" },
          { status: 401 }
        );
      }

      // ถ้าเป็นหน้าเว็บ → redirect ออกไปหน้าแรก (หรือหน้า login ภายหลัง)
      const redirectUrl = new URL("/", req.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  /* -----------------------------------------------------------------------
   * 2) Security headers เดิม (CSP / HSTS / ฯลฯ)
   * --------------------------------------------------------------------- */
  const res = NextResponse.next();

  // --- Security Headers (คุมจาก middleware จุดเดียว) ---
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    // ปิดสิทธิ์ส่วนใหญ่ (ถ้ามีฟีเจอร์ที่ต้องใช้ ค่อยเปิดเป็นรายตัว)
    "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()"
  );
  res.headers.set("Content-Security-Policy", buildCsp());

  // เปิด HSTS เฉพาะ production (ช่วยบังคับ HTTPS ทั้งโดเมน + ซับโดเมน)
  if (isProd) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // (ทางเลือก) เสริม hardening เพิ่มอีกเล็กน้อยที่ไม่กระทบ third-party
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  return res;
}

// ตัด static/_next ออก ไม่รัน middleware ทับไฟล์ static
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|og|api/og).*)",
  ],
};
