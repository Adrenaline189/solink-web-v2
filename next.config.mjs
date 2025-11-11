/** @type {import('next').NextConfig} */

// ป้องกัน ENV ชื่อ TZ ชนกับระบบของ Vercel
const TZ =
  process.env.NEXT_PUBLIC_SOLINK_TIMEZONE ||
  process.env.SOLINK_TIMEZONE ||
  "UTC";

const nextConfig = {
  experimental: {
    // ใช้ได้ต่อปกติ
    typedRoutes: true,
  },

  // ส่งค่า timezone ไปฝั่ง client แบบปลอดภัย (อ่านได้จาก process.env.NEXT_PUBLIC_SOLINK_TIMEZONE)
  env: {
    NEXT_PUBLIC_SOLINK_TIMEZONE: TZ,
  },

  async headers() {
    return [
      {
        source: "/(.*)", // ครอบทุกหน้าและ API
        headers: [
          /* -------- Security Essentials -------- */
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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

          /* -------- Isolation for perf/safety -------- */
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },

          /* -------- CSP (ให้ตรงกับที่ Vercel response) -------- */
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
              "object-src 'none'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
