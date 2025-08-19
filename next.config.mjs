// next.config.mjs
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // IMPORTANT: Do NOT set `output: 'export'` when deploying to Vercel with the App Router.
  // It breaks dynamic routes and hooks like useSearchParams during prerender.
  // output: 'export',
};

export default nextConfig;