// app/robots.ts
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // กันหน้าเปล่าไว้ก่อน (ปรับรายการได้ตามจริง)
        disallow: [
          '/ir',
          '/product','/solutions','/pricing','/customers',
          '/resources','/company','/press','/security','/contact',
        ],
      },
    ],
    // แก้เป็นโดเมนจริงเมื่อพร้อม
    sitemap: 'https://YOURDOMAIN/sitemap.xml',
  };
}
