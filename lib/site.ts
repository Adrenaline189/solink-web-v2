// lib/site.ts
export function getSiteUrl(): string {
  const direct = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (direct) return direct.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
