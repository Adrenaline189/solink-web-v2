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
  },

  // ส่งค่า timezone ไปฝั่ง client แบบปลอดภัย (อ่านได้จาก process.env.NEXT_PUBLIC_SOLINK_TIMEZONE)
  env: {
    NEXT_PUBLIC_SOLINK_TIMEZONE: TZ,
  },
};

export default nextConfig;
