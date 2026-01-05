// app/whitepaper/page.tsx
import type { Metadata } from "next";
import SeoJsonLd from "@/components/SeoJsonLd";
import WhitepaperClient from "./WhitepaperClient";

function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Whitepaper — Solink",
  description:
    "Solink whitepaper: protocol overview, architecture, tokenomics, governance, security, and roadmap.",
  alternates: { canonical: "/whitepaper" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/whitepaper",
    title: "Whitepaper — Solink",
    description:
      "Protocol overview, architecture, tokenomics, governance, security, and roadmap.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Whitepaper — Solink",
    description:
      "Protocol overview, architecture, tokenomics, governance, security, and roadmap.",
    images: ["/og.png"],
  },
};

export default function WhitepaperPage() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: "Solink Whitepaper",
    description:
      "A decentralized bandwidth-sharing network powering privacy-first connectivity and data access. Protocol design, token incentives, governance, and security posture.",
    url: `${siteUrl}/whitepaper`,
    publisher: {
      "@type": "Organization",
      name: "Solink",
      url: siteUrl,
      logo: { "@type": "ImageObject", url: `${siteUrl}/solink-logo.png` },
    },
    mainEntityOfPage: `${siteUrl}/whitepaper`,
  };

  return (
    <>
      <SeoJsonLd data={jsonLd} />
      <WhitepaperClient />
    </>
  );
}
