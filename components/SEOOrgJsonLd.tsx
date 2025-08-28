// components/SEOOrgJsonLd.tsx
import Script from "next/script";

export default function SEOOrgJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Solink",
    url: "https://solink.network",
    logo: "https://solink.network/icon-512.png",
  };
  return (
    <Script id="org-jsonld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  );
}
