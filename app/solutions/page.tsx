// app/solutions/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
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

/**
 * Avoid hydration/caching surprises: keep label stable.
 * Set NEXT_PUBLIC_DOCS_UPDATED="Jan 2, 2026" on deploy if you want a real date.
 */
function getUpdatedLabel() {
  const v = process.env.NEXT_PUBLIC_DOCS_UPDATED?.trim();
  return v && v.length > 0 ? v : "Public testnet";
}

const ROUTES = {
  contact: "/contact",
  pricing: "/pricing", // change if you don't have this page yet
  product: "/product",
  docs: "/resources",
} as const;

/** ----------------------------- Metadata (SSR) ----------------------------- */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Solutions — Solink",
  description:
    "Real-world use cases, deployment patterns, and capabilities for distributed bandwidth with policy guardrails and fair rewards.",
  alternates: { canonical: "/solutions" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/solutions",
    title: "Solutions — Solink",
    description:
      "Real-world use cases, deployment patterns, and capabilities for distributed bandwidth with policy guardrails and fair rewards.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solutions — Solink",
    description:
      "Real-world use cases, deployment patterns, and capabilities for distributed bandwidth with policy guardrails and fair rewards.",
    images: ["/og.png"],
  },
};

// --------------------- Content data (edit freely) ---------------------
const USE_CASES: Array<{
  name: string;
  problem: string;
  solution: string;
  outcome: string;
}> = [
  {
    name: "Consumer Apps",
    problem: "Traffic spikes create over-provisioning and inconsistent latency.",
    solution:
      "Burst capacity via peer nodes with policy guardrails (rate limits, geo pinning) and live analytics.",
    outcome: "Lower infra costs while maintaining predictable latency.",
  },
  {
    name: "Enterprise SaaS",
    problem: "Data residency and audit requirements slow regional expansion.",
    solution:
      "Region pinning, allow/deny lists, tamper-evident logs, SSO/SCIM, and RBAC to align with compliance.",
    outcome: "Ship to new regions faster without increasing Ops load.",
  },
  {
    name: "Web3 & Data",
    problem: "Throughput variance and reward gaming risks.",
    solution:
      "Signature checks, anomaly detection, reputation & trust score combined with Quality Factor (QF).",
    outcome: "Consistent throughput and transparent, fair rewards.",
  },
];

const INDUSTRIES = [
  { title: "Fintech & Regulated", note: "Data residency, audit, retention" },
  { title: "Marketplaces", note: "Demand spikes, global users" },
  { title: "Telecom / ISPs", note: "Last-mile augmentation" },
  { title: "AdTech / Measurement", note: "Attribution, fraud mitigation" },
  { title: "Gaming / Media", note: "Low-latency fan-out" },
  { title: "Web3 Infra", note: "RPC / Indexing / Archival" },
];

const CAPABILITIES = [
  "Region pinning & geo-routing",
  "Allow / Deny lists",
  "QoS & rate-limit policies",
  "Quality Factor (QF) & Trust Score",
  "Anomaly detection",
  "Real-time analytics",
  "Usage-based rewards (points → SLK)",
  "Tamper-evident logs",
  "RBAC & Audit trails",
  "Key rotation & signed requests",
];

const FAQ = [
  {
    q: "How does Solink work?",
    a: "End users opt in to share unused bandwidth via a lightweight client. Traffic is routed under your policies (geo/QoS), usage is measured transparently, and contributors earn points convertible to SLK under published rules.",
  },
  {
    q: "How do we control privacy and data residency?",
    a: "Use region pinning, allow/deny lists, signed requests, and tamper-evident logs. These controls support audits and local regulations.",
  },
  {
    q: "How are rewards kept fair?",
    a: "Rewards consider both volume and quality via Quality Factor (latency, jitter, uptime) and a Trust Score that reduces gaming. Payouts are transparent and auditable.",
  },
];

// ------------------------------- Page ---------------------------------
export default function SolutionsPage() {
  const siteUrl = getSiteUrl();
  const UPDATED = getUpdatedLabel();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Solutions — Solink",
        url: `${siteUrl}/solutions`,
        description:
          "Real-world use cases, deployment patterns, and capabilities for distributed bandwidth with policy guardrails and fair rewards.",
        isPartOf: { "@type": "WebSite", name: "Solink", url: siteUrl },
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQ.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <SeoJsonLd data={jsonLd} />

      {/* Hero */}
      <Reveal>
        <header>
          <h1 className="text-4xl font-semibold tracking-tight text-white">Solutions</h1>
          <p className="mt-4 max-w-3xl text-slate-300">
            Configure policies, routes, and rewards to fit your stack. Solink extends your network
            with real users’ nodes—while keeping enterprise-grade controls and transparent measurement.
          </p>

          <div className="mt-3 text-xs text-slate-400">Status: {UPDATED}</div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={ROUTES.contact}
              className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium text-white"
            >
              Talk to us
            </Link>
            <Link
              href={ROUTES.pricing}
              className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
            >
              See pricing
            </Link>
            <Link
              href={ROUTES.product}
              className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
            >
              Product overview
            </Link>
            <Link
              href={ROUTES.docs}
              className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
            >
              Docs
            </Link>
          </div>
        </header>
      </Reveal>

      {/* Use cases */}
      <section className="mt-12">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold text-white">Use cases</h2>
            <p className="mt-1 text-sm text-slate-400">Problem → Solution → Outcome</p>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.name} delay={0.06 * i}>
              <article className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <h3 className="text-lg font-medium text-white">{u.name}</h3>

                <div className="mt-3 text-sm">
                  <div className="text-slate-400">Problem</div>
                  <p className="text-slate-300">{u.problem}</p>
                </div>

                <div className="mt-3 text-sm">
                  <div className="text-slate-400">Solution</div>
                  <p className="text-slate-300">{u.solution}</p>
                </div>

                <div className="mt-3 text-sm">
                  <div className="text-slate-400">Outcome</div>
                  <p className="text-slate-300">{u.outcome}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Industries */}
      <section className="mt-12">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold text-white">Industries</h2>
            <p className="mt-1 text-sm text-slate-400">
              Teams that benefit most from distributed bandwidth.
            </p>
          </div>
        </Reveal>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {INDUSTRIES.map((i, idx) => (
            <Reveal key={i.title} delay={0.05 * idx}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="text-white font-medium">{i.title}</div>
                <div className="mt-1 text-sm text-slate-400">{i.note}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Capabilities */}
      <section className="mt-12">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold text-white">Capabilities</h2>
            <p className="mt-1 text-sm text-slate-400">
              Toggle and tune to match your compliance and performance goals.
            </p>
          </div>
        </Reveal>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <Reveal key={c} delay={0.04 * i}>
              <li className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2 text-slate-200">
                • {c}
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* How it works */}
      <section className="mt-12">
        <Reveal>
          <h2 className="text-xl font-semibold text-white">How it works</h2>
        </Reveal>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { step: "1", title: "Connect", desc: "Users install a lightweight client and accept your policies." },
            { step: "2", title: "Route", desc: "Traffic follows geo/policy/QoS controls with verifiable usage logs." },
            { step: "3", title: "Reward", desc: "Points accrue by volume and quality (QF/Trust) and convert to SLK." },
          ].map((s, i) => (
            <Reveal key={s.step} delay={0.06 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="text-sky-400 text-sm">Step {s.step}</div>
                <div className="mt-1 text-white font-medium">{s.title}</div>
                <p className="mt-2 text-sm text-slate-300">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Trust & Compliance */}
      <section className="mt-12">
        <Reveal>
          <h2 className="text-xl font-semibold text-white">Trust, Privacy & Compliance</h2>
        </Reveal>
        <Reveal delay={0.08}>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-slate-300">
            <li>Tamper-evident logs & audit trails for verifiable history.</li>
            <li>Region pinning & data residency that respect local rules.</li>
            <li>Key rotation & signed requests to reduce impersonation risk.</li>
            <li>RBAC/SSO to manage access at enterprise scale.</li>
          </ul>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mt-14">
        <Reveal>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-white text-lg font-semibold">Ready to pilot Solink?</div>
                <div className="text-slate-400 text-sm">
                  We’ll tailor sample policies and a dashboard to your use case.
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={ROUTES.contact}
                  className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium text-white"
                >
                  Contact Sales
                </Link>
                <Link
                  href={ROUTES.pricing}
                  className="rounded-2xl border border-slate-700 px-5 py-3 hover:bg-slate-900/60 text-slate-200"
                >
                  Pricing
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <Reveal>
          <h2 className="text-xl font-semibold text-white">FAQ</h2>
        </Reveal>
        <div className="mt-5 space-y-4">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={0.05 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="font-medium text-white">{f.q}</div>
                <p className="mt-2 text-sm text-slate-300">{f.a}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
