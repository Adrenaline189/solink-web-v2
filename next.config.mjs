// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  images: { remotePatterns: [] },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // ป้องกัน MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // กัน clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // ปิด XSS Auditor เก่าๆ + เปิดการป้องกันสมัยใหม่
          { key: "X-XSS-Protection", value: "0" },
          // จำกัดข้อมูล referrer
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Permissions-Policy (ตัดสิทธิ์ฟีเจอร์ที่ไม่ใช้)
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // HSTS (ตั้งหลังใช้ HTTPS แล้วจริง, ระวังตอน dev)
          // { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          // CSP แบบเบาๆ (ถ้าตั้งเข้ม ต้องทดสอบ og/image และ inline scripts)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.vercel-insights.com",
              "frame-ancestors 'self'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; ")
          }
        ]
      }
    ];
  }
};

export default nextConfig;
