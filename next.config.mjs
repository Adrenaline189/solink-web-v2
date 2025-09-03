// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true // ถ้าลบ app/locale แล้ว ก็ยังเปิดได้ตามปกติ
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP แบบย่อ (อนุญาต inline เพราะเรามีสคริปต์ตั้งธีม)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "img-src 'self' data: https:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:"
            ].join("; ")
          }
        ]
      }
    ];
  }
};
export default nextConfig;
