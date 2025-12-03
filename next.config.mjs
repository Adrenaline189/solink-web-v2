/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    typedRoutes: true,
  },
  reactStrictMode: true,
  // สำคัญ: อย่าแตะ config.webpack สำหรับ .css เลย
};

export default nextConfig;
