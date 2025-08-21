// app/robots.ts
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep placeholders out of index until ready
        disallow: [
          '/en/ir',
          '/en/product','/en/solutions','/en/pricing','/en/customers',
          '/en/resources','/en/company','/en/contact',
        ],
      },
    ],
    sitemap: 'https://YOURDOMAIN/sitemap.xml',
  };
}
