// app/pricing/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import SeoJsonLd from "@/components/SeoJsonLd";
import {
  ArrowRight,
  Zap,
  Globe,
  ShieldCheck,
  Coins,
  TrendingUp,
  Users,
  Star,
} from "lucide-react";

/* ------------------------------ helpers (SSR) ------------------------------ */
function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Pricing — Solink",
  description:
    "Simple, transparent pricing for bandwidth consumers. Pay with fiat or SLK. Node operators earn SLK by sharing bandwidth.",
  alternates: { canonical: "/pricing" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/pricing",
    title: "Pricing — Solink",
    description: "Bandwidth pricing for consumers. Earn SLK by sharing bandwidth as a node operator.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing — Solink",
    description: "Simple, transparent pricing for bandwidth consumers.",
    images: ["/og.png"],
  },
};

/* ------------------------------ constants ------------------------------ */
const CONSUMER_PLANS = [
  {
    name: "Community",
    price: "Free",
    priceSub: "for testing & light usage",
    desc: "Best for developers exploring the network during testnet.",
    features: [
      "Up to 100 GB / month",
      "Community support",
      "Basic QoS settings",
      "Dashboard & reporting",
    ],
    cta: { label: "Open Dashboard", href: "/dashboard" },
    highlight: false,
    accent: "slate",
  },
  {
    name: "Growth",
    price: "$0.04",
    priceSub: "per GB",
    desc: "For applications that need reliable, scalable bandwidth.",
    features: [
      "Up to 500 GB / month",
      "Priority routing & QoS",
      "Private dashboards",
      "API access",
      "SLK payment accepted",
    ],
    cta: { label: "Start Growing", href: "/dashboard" },
    highlight: true,
    accent: "cyan",
  },
  {
    name: "Scale",
    price: "Custom",
    priceSub: "volume discounts available",
    desc: "For high-volume applications with custom requirements.",
    features: [
      "Unlimited GB / month",
      "Dedicated region routing",
      "SLA & uptime guarantee",
      "Account management",
      "Custom integrations",
    ],
    cta: { label: "Contact Sales", href: "/contact" },
    highlight: false,
    accent: "slate",
  },
];

/* ------------------------------ page ------------------------------ */
export default function PricingPage() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Pricing — Solink",
    url: `${siteUrl}/pricing`,
    description: "Bandwidth pricing for consumers. Earn SLK by sharing bandwidth as a node operator.",
    isPartOf: { "@type": "WebSite", name: "Solink", url: siteUrl },
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <SeoJsonLd data={jsonLd} />

      {/* ===== HERO ===== */}
      <Reveal>
        <header className="max-w-3xl">
          <h1 className="text-4xl font-extrabold mb-3">Pricing</h1>
          <p className="text-slate-400 text-lg">
            Simple, transparent pricing for bandwidth consumers.
            <br />
            Pay with fiat or SLK — SLK holders get automatic discounts.
          </p>
        </header>
      </Reveal>

      {/* ===== CONSUMER PRICING ===== */}
      <section className="mt-12">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-cyan-900/30 border border-cyan-700/40 p-2">
              <Globe className="size-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">For Bandwidth Consumers</h2>
              <p className="text-sm text-slate-400">Pay for the bandwidth you use. Volume discounts available.</p>
            </div>
          </div>
        </Reveal>

        <div className="grid md:grid-cols-3 gap-6">
          {CONSUMER_PLANS.map((p, i) => (
            <Reveal key={p.name} delay={0.06 * i}>
              <article
                className={[
                  "rounded-2xl border p-6 flex flex-col",
                  p.highlight
                    ? "border-cyan-500/50 bg-cyan-950/20"
                    : "border-slate-800 bg-slate-900/40",
                ].join(" ")}
              >
                {p.highlight && (
                  <div className="mb-3 inline-flex rounded-full border border-cyan-600/40 bg-cyan-900/20 px-3 py-1 text-xs text-cyan-300 w-fit">
                    Most Popular
                  </div>
                )}

                <div className="text-slate-200 font-semibold text-lg">{p.name}</div>

                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{p.price}</span>
                  {p.price !== "Custom" && (
                    <span className="text-slate-400 text-sm mb-1.5">{p.priceSub}</span>
                  )}
                </div>
                <div className="text-slate-500 text-xs mt-1">{p.desc}</div>

                <ul className="text-slate-300 text-sm space-y-2 mt-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-cyan-400 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={p.cta.href}
                  className={[
                    "mt-6 w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold transition text-sm",
                    p.highlight
                      ? "bg-cyan-600/90 hover:bg-cyan-600 text-white"
                      : "border border-slate-700 hover:bg-slate-800/60 text-slate-200",
                  ].join(" ")}
                >
                  {p.cta.label}
                  <ArrowRight className="size-4" />
                </Link>
              </article>
            </Reveal>
          ))}
        </div>

        {/* SLK discount callout */}
        <Reveal delay={0.2}>
          <div className="mt-6 rounded-2xl border border-cyan-800/50 bg-cyan-950/20 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <Coins className="size-8 text-cyan-400" />
              <div>
                <div className="font-semibold text-white">Pay with SLK — get up to 20% off</div>
                <div className="text-sm text-slate-400">
                  SLK holders receive automatic discounts on all paid plans. The more SLK you hold, the bigger your discount.
                </div>
              </div>
            </div>
            <Link
              href="/tokenomics"
              className="shrink-0 rounded-xl border border-cyan-700/50 bg-cyan-900/30 px-4 py-2 text-sm text-cyan-300 hover:bg-cyan-900/50 transition text-center"
            >
              Learn about SLK →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ===== NODE OPERATORS ===== */}
      <section className="mt-16">
        <Reveal>
          <div className="flex items-center gap-3 mb-6">
            <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/40 p-2">
              <Zap className="size-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">For Node Operators</h2>
              <p className="text-sm text-slate-400">Share bandwidth. Earn SLK. No upfront costs.</p>
            </div>
          </div>
        </Reveal>

        {/* Earn cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <Reveal>
            <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <TrendingUp className="size-6 text-emerald-400" />
                <h3 className="text-lg font-bold">How Much Can You Earn?</h3>
              </div>
              <p className="text-slate-400 text-sm mb-5">
                Earn SLK tokens proportional to your quality-adjusted bandwidth contribution. Reliable nodes with high uptime earn more.
              </p>

              <div className="space-y-3">
                {[
                  { label: "Quality Factor (QF)", desc: "Adjusted by latency, jitter, uptime" },
                  { label: "Trust Score", desc: "Rewards consistent, anomaly-free nodes" },
                  { label: "Reward Rate", desc: "Dynamic — based on network demand" },
                ].map((r) => (
                  <div key={r.label} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div>
                      <div className="text-sm font-medium text-white">{r.label}</div>
                      <div className="text-xs text-slate-400">{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/dashboard"
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-700 px-4 py-2.5 font-semibold text-white transition text-sm"
              >
                Open Dashboard <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="size-6 text-emerald-400" />
                <h3 className="text-lg font-bold">Anti-Gaming Protection</h3>
              </div>
              <p className="text-slate-400 text-sm mb-5">
                The protocol detects and penalizes fake traffic, telemetry manipulation, and Sybil attacks. Honest nodes are always rewarded more.
              </p>

              <div className="space-y-3">
                {[
                  { icon: <ShieldCheck className="size-4" />, text: "Anomaly detection on traffic patterns" },
                  { icon: <TrendingUp className="size-4" />, text: "Uptime-weighted reward distribution" },
                  { icon: <Users className="size-4" />, text: "Node identity verification" },
                  { icon: <Star className="size-4" />, text: "Trust Score updated in real-time" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="text-emerald-400">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>

              <Link
                href="/whitepaper"
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl border border-emerald-700/50 hover:bg-emerald-900/30 px-4 py-2.5 font-semibold text-emerald-300 transition text-sm"
              >
                Read Whitepaper <ArrowRight className="size-4" />
              </Link>
            </div>
          </Reveal>
        </div>

        {/* Key stats */}
        <Reveal delay={0.15}>
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm font-semibold text-slate-300 mb-4">Example Earnings (Illustrative)</div>
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Light User", speed: "10 Mbps sustained", earn: "~500 SLK / month" },
                { label: "Regular User", speed: "50 Mbps sustained", earn: "~3,000 SLK / month" },
                { label: "Power User", speed: "100+ Mbps sustained", earn: "~8,000+ SLK / month" },
              ].map((e) => (
                <div key={e.label} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                  <div className="text-xs text-slate-500 mb-1">{e.label}</div>
                  <div className="text-sm text-slate-300 mb-1">{e.speed}</div>
                  <div className="text-emerald-400 font-semibold text-sm">{e.earn}</div>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">
              * Estimates are illustrative and depend on network demand, QF, and Trust Score. Actual earnings may vary.
            </p>
          </div>
        </Reveal>
      </section>

      {/* ===== FAQ ===== */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-xl font-bold mb-5">Common Questions</h2>
        </Reveal>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            {
              q: "How is bandwidth pricing calculated?",
              a: "Bandwidth is billed per GB used. Monthly plans include a GB allowance; overages are charged at the same per-GB rate.",
            },
            {
              q: "Can I pay with SLK?",
              a: "Yes. SLK holders automatically receive up to 20% discount on all paid plans based on SLK holdings.",
            },
            {
              q: "How are node operator rewards calculated?",
              a: "Rewards are based on Quality Factor (QF), Trust Score, and network demand. Reliable, consistent nodes earn more.",
            },
            {
              q: "Is there a minimum bandwidth requirement to earn?",
              a: "No minimum, but nodes with higher sustained bandwidth and uptime will earn proportionally more SLK.",
            },
            {
              q: "When can I start earning?",
              a: "Once the mainnet is live, download the Solink client, connect your wallet, and start sharing bandwidth to earn SLK.",
            },
            {
              q: "What's the difference between testnet and mainnet?",
              a: "Testnet rewards are for testing only. Mainnet rewards are the real SLK token with actual economic value.",
            },
          ].map((faq, i) => (
            <Reveal key={i} delay={0.05 * i}>
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="font-medium text-white text-sm mb-1">{faq.q}</div>
                <div className="text-slate-400 text-sm">{faq.a}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ===== CTA ===== */}
      <Reveal>
        <div className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-tr from-cyan-950/30 to-emerald-950/30 p-8 text-center">
          <h2 className="text-2xl font-bold">Ready to get started?</h2>
          <p className="mt-2 text-slate-400 max-w-lg mx-auto">
            Join the network as a consumer or node operator. No upfront costs to participate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-white/90 transition"
            >
              Open Dashboard <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/presale"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800/60 transition"
            >
              Join Presale
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800/60 transition"
            >
              Talk to Sales
            </Link>
          </div>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
