// app/sitemap.ts
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const routes = [
    "", "product", "solutions", "pricing", "customers",
    "resources", "ir", "contact", "dashboard", "settings"
  ];

  const now = new Date();

  return routes.map((p) => ({
    url: `${base}/${p}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: p === "" ? 1 : 0.6
  }));
}
