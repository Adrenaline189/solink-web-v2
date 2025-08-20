export default function sitemap() {
  const base = 'https://YOURDOMAIN'; // แก้เป็นโดเมนจริง
  const routes = [
    '',           // /
    'dashboard',  // /dashboard
    // พร้อมเมื่อไหร่ค่อยทยอยเพิ่ม: 'product','solutions', ...
  ];
  return routes.map((r) => ({
    url: `${base}/${r}`,
    changefreq: 'weekly',
    priority: r === '' ? 1.0 : 0.7,
  }));
}