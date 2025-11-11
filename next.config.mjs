// next.config.mjs
/** @type {import('next').NextConfig} */

// ใช้ alias env แทน TZ (Vercel กันชื่อ TZ ไว้)
// ตั้งที่ Vercel เป็น NEXT_PUBLIC_SOLINK_TIMEZONE=UTC (หรือ SOLINK_TIMEZONE=UTC ก็ได้)
const TZ =
  process.env.NEXT_PUBLIC_SOLINK_TIMEZONE ||
  process.env.SOLINK_TIMEZONE ||
  "UTC";

const nextConfig = {
  experimental: {
    // ยังเปิด typedRoutes ได้ตามปกติ
    typedRoutes: true,
  },

  // ส่งค่า timezone ไปฝั่ง client แบบ build-time safe
  env: {
    NEXT_PUBLIC_SOLINK_TIMEZONE: TZ,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // ให้ฝังในโดเมนตัวเองได้ (ตรงกับที่ Vercel ตอบกลับ)
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
          },
          // CSP ให้สอดคล้องกับ response บน Vercel (รองรับ vercel.live + vitals)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' vercel.live https://vitals.vercel-insights.com",
              "connect-src 'self' https://vitals.vercel-insights.com https://vercel.live ws: wss:",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
