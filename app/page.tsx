// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import SeoJsonLd from "@/components/SeoJsonLd";

export const metadata: Metadata = {
  title: "Solink — Share bandwidth. Earn rewards.",
  description: "Share bandwidth. Earn rewards.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // JSON-LD สำหรับหน้าโฮม (Website + Organization)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Solink",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Solink",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/solink-logo.png`,
      },
    },
  };

  return (
    <div className="min-h-[80vh]">
      {/* SEO JSON-LD */}
      <SeoJsonLd data={jsonLd} />

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
              Share bandwidth.{" "}
              <span className="bg-gradient-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
                Earn rewards.
              </span>
            </h1>
            <p className="text-slate-400 mt-4 text-lg">
              Plug in, contribute unused bandwidth, and earn SLK.
              Your data stays private, your node stays yours.
            </p>

            <div className="flex gap-3 mt-6">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium transition"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/pricing"
                className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3 transition"
              >
                See Pricing
              </Link>
            </div>

            <div className="mt-4 text-sm text-slate-500">
              Invited? Use your link: <code className="text-slate-300">/r/&lt;code&gt;</code>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 p-6">
            <div className="text-slate-300 font-semibold mb-3">Why Solink?</div>
            <ul className="space-y-3 text-slate-400">
              <li>• Non-custodial — your device, your control</li>
              <li>• Transparent points → SLK conversion</li>
              <li>• Quality Factor & Trust Score to boost earnings</li>
              <li>• Referral program with fair rewards</li>
            </ul>

            <div className="h-4" />

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-slate-800 p-3">
                <div className="text-2xl font-bold">2.1</div>
                <div className="text-xs text-slate-400">Avg Mbps</div>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <div className="text-2xl font-bold">12,450</div>
                <div className="text-xs text-slate-400">Total Points</div>
              </div>
              <div className="rounded-xl border border-slate-800 p-3">
                <div className="text-2xl font-bold">82%</div>
                <div className="text-xs text-slate-400">QF</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
