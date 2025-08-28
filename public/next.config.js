/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Adjust CSP as needed (left minimal here)
  // { key: 'Content-Security-Policy', value: "default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:" },
];

const nextConfig = {
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
    ];
  },
};

module.exports = nextConfig;
