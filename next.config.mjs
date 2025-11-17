/** @type {import('next').NextConfig} */

// ป้องกัน ENV ชื่อ TZ ชนกับระบบของ Vercel
const TZ =
  process.env.NEXT_PUBLIC_SOLINK_TIMEZONE ||
  process.env.SOLINK_TIMEZONE ||
  "UTC";

const nextConfig = {
  experimental: {
    // เปิดใช้ typedRoutes ตามเดิม
    typedRoutes: true,

    // ❤️ สำคัญมาก: อนุญาต origin ที่จะใช้ server actions (และหลีกเลี่ยงปัญหา set-cookie ถูก block)
    serverActions: {
      allowedOrigins: ["https://www.solink.network"],
    },
  },

  // ส่งค่า timezone ไป client
  env: {
    NEXT_PUBLIC_SOLINK_TIMEZONE: TZ,
  },

  // ถอด X-Powered-By เพื่อลด fingerprinting ของ server
  poweredByHeader: false,
};

export default nextConfig;
