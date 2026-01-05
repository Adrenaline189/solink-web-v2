// app/product/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SeoJsonLd from "@/components/SeoJsonLd";
import type { ReactNode } from "react";

import {
  Shield,
  Zap,
  Globe2,
  BarChart3,
  Rocket,
  Boxes,
  Server,
  Lock,
  BookOpen,
  Github,
  Workflow,
  Cpu,
  Code,
  Sparkles,
} from "lucide-react";

/** ----------------------------- helpers (SSR) ----------------------------- */
function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

/**
 * Avoid hydration surprises: keep "updated" stable.
 * Prefer an env var you can set on deploy. Fallback to a safe static label.
 */
function getUpdatedLabel() {
  const v = process.env.NEXT_PUBLIC_DOCS_UPDATED?.trim();
  return v && v.length > 0 ? v : "Public testnet";
}

const ROUTES = {
  contact: "/contact",
  resources: "/resources",
  download: "/download",
  tokenomics: "/tokenomics",
} as const;

/** ----------------------------- Metadata (SSR) ----------------------------- */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Product — Solink",
  description: "Solink product overview: how it works, core features, security, and FAQs.",
  alternates: { canonical: "/product" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/product",
    title: "Product — Solink",
    description: "Solink product overview: how it works, core features, security, and FAQs.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Product — Solink",
    description: "Solink product overview: how it works, core features, security, and FAQs.",
    images: ["/og.png"],
  },
};

/** ----------------------------- content blocks ---------------------------- */
const HIGHLIGHTS = [
  { icon: <Zap className="h-5 w-5" />, title: "Instant setup", desc: "Lightweight client with fast onboarding." },
  { icon: <Globe2 className="h-5 w-5" />, title: "Global network", desc: "Elastic routing across regions with policy controls." },
  { icon: <BarChart3 className="h-5 w-5" />, title: "Real-time analytics", desc: "Transparent usage, quality signals, and rewards." },
  { icon: <Shield className="h-5 w-5" />, title: "Security-first", desc: "Encrypted channels, identity, and policy enforcement." },
];

const MODULES = [
  { icon: <Boxes className="h-5 w-5" />, name: "Routing", desc: "Policy-based routing with region pinning & failover." },
  { icon: <Server className="h-5 w-5" />, name: "Earnings", desc: "Rewards engine with anti-fraud and quality signals." },
  { icon: <Lock className="h-5 w-5" />, name: "Observability", desc: "Metrics, logs, and health signals—pilot-ready." },
];

const USE_CASES = [
  { icon: <Workflow className="h-5 w-5" />, name: "Crowd bandwidth", desc: "Aggregate idle capacity from edge nodes." },
  { icon: <Cpu className="h-5 w-5" />, name: "Egress control", desc: "Route traffic with region and QoS constraints." },
  { icon: <Globe2 className="h-5 w-5" />, name: "Multi-region apps", desc: "Reduce latency with local exit points." },
];

const FAQ = [
  {
    q: "How do rewards work?",
    a: "You earn points based on contribution and quality signals (e.g., uptime/latency). Points may be converted to SLK following published conversion rules.",
  },
  {
    q: "What data do you collect?",
    a: "Operational metrics only (latency, throughput, health). We don’t inspect user payload contents.",
  },
  {
    q: "Can I run this on a VPS or at home?",
    a: "Yes. The client is lightweight and can run on common Linux/macOS/Windows hosts. Requirements depend on your bandwidth and policy settings.",
  },
];

export default function ProductPage() {
  const siteUrl = getSiteUrl();
  const UPDATED = getUpdatedLabel();

  // JSON-LD: WebPage + FAQPage (conservative claims)
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        name: "Product — Solink",
        url: `${siteUrl}/product`,
        description: "Solink product overview: how it works, core features, security, and FAQs.",
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
    <main className="mx-auto max-w-6xl px-6 py-16">
      <SeoJsonLd data={jsonLd} />

      {/* Hero */}
      <Reveal>
        <header className="text-center">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-sky-700/40 bg-sky-900/20 px-3 py-1 text-xs text-sky-300">
            <Sparkles className="h-3.5 w-3.5" />
            Product overview
          </p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight">Product</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Solink makes bandwidth sharing simple, secure, and rewarding—built for builders and teams who care about
            policy and transparency.
          </p>

          <div className="mt-3 text-xs text-slate-400">Status: {UPDATED}</div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={ROUTES.contact}
              className="rounded-2xl bg-sky-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
            >
              Request a demo
            </Link>

            <Link
              href={ROUTES.resources}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/60"
            >
              Read docs
            </Link>

            <Link
              href={ROUTES.download}
              className="rounded-2xl border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-900/60"
            >
              Download client
            </Link>
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Looking for token details?{" "}
            <Link className="text-slate-300 underline underline-offset-4 hover:text-slate-200" href={ROUTES.tokenomics}>
              Tokenomics
            </Link>
          </div>
        </header>
      </Reveal>

      {/* Highlights */}
      <section className="mt-14">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Core capabilities</h2>
            <p className="mt-1 text-slate-400">What you can do with Solink—at a glance.</p>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HIGHLIGHTS.map((h, i) => (
            <Reveal key={h.title} delay={0.05 * i}>
              <CardBadge icon={h.icon} title={h.title} desc={h.desc} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">How it works</h2>
            <p className="mt-1 text-slate-400">Three steps to get value on day one.</p>
          </div>
        </Reveal>

        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            { step: "1", title: "Install client", desc: "Run the lightweight agent on your host (1–2 commands)." },
            { step: "2", title: "Start sharing", desc: "Advertise capacity and enforce your policies locally." },
            { step: "3", title: "Earn & track", desc: "View quality signals and rewards in the dashboard." },
          ].map((s, i) => (
            <Reveal key={s.step} delay={0.06 * i}>
              <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <div className="text-sky-300 text-sm">Step {s.step}</div>
                <div className="mt-1 text-white font-medium">{s.title}</div>
                <p className="mt-2 text-slate-300">{s.desc}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* Modules */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Modules</h2>
            <p className="mt-1 text-slate-400">Compose what you need—keep the rest out.</p>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {MODULES.map((m, i) => (
            <Reveal key={m.name} delay={0.05 * i}>
              <CardBadge icon={m.icon} title={m.name} desc={m.desc} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Use cases */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Use cases</h2>
            <p className="mt-1 text-slate-400">Popular patterns teams run in practice.</p>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {USE_CASES.map((u, i) => (
            <Reveal key={u.name} delay={0.05 * i}>
              <CardBadge icon={u.icon} title={u.name} desc={u.desc} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Architecture (compact) */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Architecture at a glance</h2>
            <p className="mt-1 text-slate-400">A simple control plane with a secure, policy-driven data plane.</p>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="grid gap-4 md:grid-cols-3">
              <ArchCol title="Client" text="Lightweight agent exposes capacity and enforces policies locally." />
              <ArchCol title="Control Plane" text="Auth, routing policy, reputation & rewards, observability." />
              <ArchCol title="Data Plane" text="Encrypted tunnels, regional exits, QoS and rate control." />
            </div>
          </div>
        </Reveal>
      </section>

      {/* Security */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Security & compliance</h2>
            <p className="mt-1 text-slate-400">Designed with conservative defaults and policy controls.</p>
          </div>
        </Reveal>

        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {[
            "TLS for control and data channels",
            "Request signing & integrity checks",
            "Node identity and revocation",
            "Fine-grained routing policies (region/QoS/egress limits)",
          ].map((s, i) => (
            <Reveal key={s} delay={0.05 * i}>
              <li className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-3">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 text-sky-300" />
                  <span className="text-slate-300">{s}</span>
                </div>
              </li>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* Developers */}
      <section className="mt-16">
        <Reveal>
          <div>
            <h2 className="text-xl font-semibold">Developers</h2>
            <p className="mt-1 text-slate-400">Docs, examples, and guides to integrate or automate Solink.</p>
          </div>
        </Reveal>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {[
            { href: ROUTES.resources, label: "Docs", icon: <BookOpen className="h-4 w-4" /> },
            { href: ROUTES.resources, label: "API examples", icon: <Code className="h-4 w-4" /> },
            { href: ROUTES.resources, label: "SDK guides", icon: <Rocket className="h-4 w-4" /> },
            { href: ROUTES.resources, label: "Changelog", icon: <BarChart3 className="h-4 w-4" /> },
            { href: ROUTES.resources, label: "GitHub (soon)", icon: <Github className="h-4 w-4" /> },
          ].map((l, i) => (
            <Reveal key={l.label} delay={0.05 * i}>
              <Link
                href={l.href}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm hover:bg-slate-900/60"
                aria-label={l.label}
              >
                {l.icon}
                <span>{l.label}</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <Reveal>
          <h2 className="text-xl font-semibold">FAQ</h2>
        </Reveal>

        <dl className="mt-4 space-y-3">
          {FAQ.map((f, i) => (
            <Reveal key={f.q} delay={0.05 * i}>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <dt className="font-medium text-white">{f.q}</dt>
                <dd className="mt-1 text-slate-300">{f.a}</dd>
              </div>
            </Reveal>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="mt-16">
        <Reveal>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
            <h3 className="text-xl font-semibold text-white">Ready to try Solink?</h3>
            <p className="mt-2 text-slate-300">Request a guided demo or start a pilot tailored to your needs.</p>

            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <Link
                href={ROUTES.contact}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600/90 px-4 py-2 text-sm text-white hover:bg-sky-600"
              >
                <Rocket className="h-4 w-4" />
                Request a demo
              </Link>

              <Link
                href={ROUTES.resources}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-900/60"
              >
                <BookOpen className="h-4 w-4" />
                Read docs
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Disclaimer: features and reward rules may evolve during testnet as documented.
            </p>
          </div>
        </Reveal>
      </section>
    </main>
  );
}

/* ------------------------------ small parts ------------------------------ */

function CardBadge({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs text-slate-200">
        <span className="text-slate-200">{icon}</span>
        <span>{title}</span>
      </div>
      <p className="mt-3 text-slate-300">{desc}</p>
    </div>
  );
}

function ArchCol({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <div className="font-medium text-white">{title}</div>
      <p className="mt-1 text-slate-300">{text}</p>
    </div>
  );
}
