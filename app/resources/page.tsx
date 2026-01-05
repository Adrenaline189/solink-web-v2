// app/resources/page.tsx
import type { Metadata } from "next";
import ResourcesClient from "./ResourcesClient";
import SeoJsonLd from "@/components/SeoJsonLd";

/** ----------------------------- helpers (SSR) ----------------------------- */
function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Resources — Solink",
  description: "Docs, guides, changelog, and updates to help you ship with Solink.",
  alternates: { canonical: "/resources" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/resources",
    title: "Resources — Solink",
    description: "Docs, guides, changelog, and updates to help you ship with Solink.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources — Solink",
    description: "Docs, guides, changelog, and updates to help you ship with Solink.",
    images: ["/og.png"],
  },
};

export default function ResourcesPage() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Resources — Solink",
    url: `${siteUrl}/resources`,
    description: "Docs, guides, changelog, and updates to help you ship with Solink.",
    isPartOf: { "@type": "WebSite", name: "Solink", url: siteUrl },
  };

  return (
    <>
      <SeoJsonLd data={jsonLd} />
      <ResourcesClient />
    </>
  );
}
