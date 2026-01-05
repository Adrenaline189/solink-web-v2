// app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import SeoJsonLd from "@/components/SeoJsonLd";

/** ----------------------------- helpers (SSR) ----------------------------- */
function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

function getUpdatedLabel() {
  const v = process.env.NEXT_PUBLIC_DOCS_UPDATED?.trim();
  return v && v.length > 0 ? v : "Public testnet";
}

const ROUTES = {
  dashboard: "/dashboard",
  contact: "/contact",
  solutions: "/solutions",
  docs: "/resources",
} as const;

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Pricing — Solink",
  description: "Plans for pilots and production deployments. Pricing may evolve during testnet.",
  alternates: { canonical: "/pricing" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/pricing",
    title: "Pricing — Solink",
    description: "Plans for pilots and production deployments. Pricing may evolve during testnet.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Solink",
    description: "Plans for pilots and production deployments. Pricing may evolve during testnet.",
    images: ["/og.png"],
  },
};

const plans = [
  {
    name: "Community",
    price: "Free",
    desc: "Best for getting started on testnet",
    features: ["Basic node", "Referral enabled", "Community support", "Fair-use limits"],
    cta: { label: "Open Dashboard", href: ROUTES.dashboard },
    highlight: false,
  },
  {
    name: "Pilot",
    price: "By request",
    desc: "For teams validating a real use case",
    features: [
      "Policy setup assistance",
      "Private dashboards & reporting",
      "Priority support",
      "Pilot traffic allocation",
    ],
    cta: { label: "Request Pilot", href: ROUTES.contact },
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Contact",
    desc: "Custom throughput, fleet, or compliance needs",
    features: ["Dedicated regions (optional)", "SLA options", "RBAC / audit trails", "Account management"],
    cta: { label: "Contact Sales", href: ROUTES.contact },
    highlight: false,
  },
];

export default function PricingPage() {
  const siteUrl = getSiteUrl();
  const updated = getUpdatedLabel();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pricing — Solink",
    url: `${siteUrl}/pricing`,
    description: "Plans for pilots and production deployments. Pricing may evolve during testnet.",
    isPartOf: { "@type": "WebSite", name: "Solink", url: siteUrl },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SeoJsonLd data={jsonLd} />

      <Reveal>
        <header className="max-w-3xl">
          <h1 className="text-4xl font-extrabold mb-2">Plans</h1>
          <p className="text-slate-400">
            Use Solink for free on testnet, or request a pilot for real-world evaluation.
          </p>
          <div className="mt-3 text-xs text-slate-500">
            Status: {updated} • Pricing may change as the network matures.
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.solutions}
              className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
            >
              See Solutions
            </Link>
            <Link
              href={ROUTES.docs}
              className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
            >
              Read Docs
            </Link>
          </div>
        </header>
      </Reveal>

      <div className="mt-10 grid md:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={0.06 * i}>
            <article
              className={[
                "rounded-2xl border p-6 bg-slate-900/40",
                p.highlight ? "border-sky-500/50" : "border-slate-800",
              ].join(" ")}
            >
              {p.highlight && (
                <div className="mb-3 inline-flex rounded-full border border-sky-600/40 bg-sky-900/20 px-3 py-1 text-xs text-sky-300">
                  Recommended for teams
                </div>
              )}

              <div className="text-slate-200 font-semibold">{p.name}</div>
              <div className="text-3xl font-extrabold mt-2">{p.price}</div>
              <div className="text-slate-400 text-sm mt-1">{p.desc}</div>

              <ul className="text-slate-300 text-sm space-y-2 mt-4">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>

              <Link
                href={p.cta.href}
                className={[
                  "mt-6 inline-flex w-full justify-center rounded-xl px-4 py-2 transition",
                  p.highlight
                    ? "bg-sky-600/90 hover:bg-sky-600 text-white"
                    : "border border-slate-700 hover:bg-slate-900/60 text-slate-100",
                ].join(" ")}
                aria-label={`${p.cta.label} for ${p.name}`}
              >
                {p.cta.label}
              </Link>
            </article>
          </Reveal>
        ))}
      </div>

      {/* What this page is for (practical, not marketing fluff) */}
      <section className="mt-12">
        <Reveal>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-semibold text-white">What’s included in a Pilot?</h2>
            <p className="mt-2 text-sm text-slate-300 max-w-3xl">
              A pilot is meant to validate routing policies, quality signals (QF/Trust), reporting, and operational safety
              in your environment. We keep deliverables concrete and measurable.
            </p>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {[
                { title: "Policy template", desc: "Region pinning, QoS, allow/deny, rate limits." },
                { title: "Dashboards", desc: "Usage, latency, uptime, rewards and anomaly signals." },
                { title: "Support", desc: "Pilot guidance + prioritised issue resolution." },
              ].map((b) => (
                <div key={b.title} className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                  <div className="font-medium text-white">{b.title}</div>
                  <div className="mt-1 text-sm text-slate-400">{b.desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={ROUTES.contact}
                className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium text-white"
              >
                Request a Pilot
              </Link>
              <Link
                href={ROUTES.dashboard}
                className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
              >
                Explore Dashboard
              </Link>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              Note: pricing and limits are subject to change during testnet. Keep policies conservative for compliance.
            </p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}
