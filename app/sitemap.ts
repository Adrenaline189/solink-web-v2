// app/sitemap.ts
export default function sitemap() {
  const base = 'https://YOURDOMAIN';
  const routes = ['', 'ir']; // add real pages when ready
  return routes.map((r) => ({
    url: `${base}/en/${r}`,
    changefreq: 'weekly',
    priority: r === '' ? 1.0 : 0.7,
  }));
}
