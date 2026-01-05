import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import Footer from "@/components/Footer";
import SeoJsonLd from "@/components/SeoJsonLd";
import Reveal from "@/components/Reveal";

import {
  Gauge,
  ShieldCheck,
  Users2,
  Wallet,
  Cable,
  Share2,
  Coins,
  CheckCircle2,
  FileText,
  Download,
  Sparkles,
} from "lucide-react";

/** ----------------------------- Metadata (SSR) ----------------------------- */
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://www.solink.network"),
  title: "Solink — Share bandwidth. Earn rewards.",
  description:
    "Share unused bandwidth, earn points, and convert to SLK. Non-custodial by design with quality-based rewards.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: "/",
    title: "Solink — Share bandwidth. Earn rewards.",
    description:
      "Share unused bandwidth, earn points, and convert to SLK. Non-custodial by design with quality-based rewards.",
    siteName: "Solink",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Solink" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solink — Share bandwidth. Earn rewards.",
    description:
      "Share unused bandwidth, earn points, and convert to SLK. Non-custodial by design with quality-based rewards.",
    images: ["/og.png"],
  },
};

/** ---- Helper SSR: Stable base URL (server-only) ---- */
function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

export default function HomePage() {
  const siteUrl = getSiteUrl();

  /**
   * JSON-LD: Organization + WebSite + FAQPage
   * Note: Keep claims conservative. Don’t promise things you can’t verify.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "Solink",
        url: siteUrl,
        logo: `${siteUrl}/solink-logo.png`,
      },
      {
        "@type": "WebSite",
        name: "Solink",
        url: siteUrl,
        potentialAction: {
          "@type": "SearchAction",
          target: `${siteUrl}/?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
        publisher: { "@type": "Organization", name: "Solink", url: siteUrl },
      },
      {
        "@type": "FAQPage",
        mainEntity: [
          {
            "@type": "Question",
            name: "How do rewards work?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "You earn points based on network contribution and quality signals (e.g., uptime, latency). Points may be convertible to SLK according to published conversion rules.",
            },
          },
          {
            "@type": "Question",
            name: "Is my traffic private?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Solink is designed to be non-custodial: you keep control of your device and configuration. Privacy practices depend on client configuration and published policies.",
            },
          },
          {
            "@type": "Question",
            name: "Can I invite friends?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Yes. You can share a referral link and earn bonus points according to the referral program rules.",
            },
          },
        ],
      },
    ],
  };

  return (
    <div className="min-h-[80vh]">
      <SeoJsonLd data={jsonLd} />

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="inline-flex items-center gap-2 rounded-full border border-sky-700/40 bg-sky-900/20 px-3 py-1 text-xs text-sky-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Public testnet
                </p>
                <p className="text-xs text-slate-500">
                  Non-custodial design • Quality-based rewards
                </p>
              </div>

              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
                Share bandwidth.{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
                  Earn rewards.
                </span>
              </h1>

              <p className="text-slate-400 mt-4 text-lg">
                Contribute unused bandwidth safely, earn points in real time, and convert to{" "}
                <span className="text-slate-200 font-medium">SLK</span> under transparent rules.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium transition"
                >
                  Go to Dashboard
                </Link>

                <Link
                  href="/tokenomics"
                  className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3 transition"
                >
                  Tokenomics
                </Link>

                <Link
                  href="/presale"
                  className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3 transition"
                >
                  Presale
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-500">
                <span>
                  Invited? Use <code className="text-slate-300">/r/&lt;code&gt;</code>
                </span>
                <span className="text-slate-700">•</span>
                <Link href="/docs" className="text-slate-300 hover:text-slate-200 underline underline-offset-4">
                  Read docs
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/download" className="text-slate-300 hover:text-slate-200 underline underline-offset-4">
                  Download client
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 p-6">
              <div className="text-slate-300 font-semibold mb-3">Why Solink?</div>

              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>Non-custodial mindset — you stay in control</span>
                </li>
                <li className="flex items-start gap-2">
                  <Gauge className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>Quality Factor & Trust Score can boost earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-sky-300" />
                  <span>Transparent points → SLK conversion rules</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users2 className="mt-0.5 h-4 w-4 text-indigo-300" />
                  <span>Fair referral rewards — grow together</span>
                </li>
              </ul>

              <div className="h-5" />

              {/* IMPORTANT: avoid fake “live” stats */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-slate-200">Network snapshot</div>
                  <div className="text-xs text-slate-500">Sample (beta)</div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <StatCard value="2.1" label="Avg Mbps" />
                  <StatCard value="12,450" label="Total Points" />
                  <StatCard value="82%" label="Quality (QF)" />
                </div>

                <p className="mt-3 text-xs text-slate-500">
                  Replace these with real metrics when your public endpoint is ready.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold">How it works</h2>
            <p className="text-slate-400 mt-1">Three steps to start earning.</p>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <Reveal>
                <Step
                  icon={<Cable className="h-5 w-5" />}
                  title="1) Plug in"
                  text="Install the client and connect your device."
                />
              </Reveal>
              <Reveal>
                <Step
                  icon={<Share2 className="h-5 w-5" />}
                  title="2) Share bandwidth"
                  text="Contribute idle bandwidth with quality signals tracked."
                />
              </Reveal>
              <Reveal>
                <Step
                  icon={<Coins className="h-5 w-5" />}
                  title="3) Earn SLK"
                  text="Accrue points and convert to SLK under published rules."
                />
              </Reveal>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/download"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3 transition"
              >
                <Download className="h-4 w-4" />
                Download client
              </Link>
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3 transition"
              >
                <FileText className="h-4 w-4" />
                Read docs
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold">Features that matter</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Reveal>
                <Feature
                  icon={<ShieldCheck className="h-5 w-5 text-emerald-400" />}
                  title="Privacy-first design"
                  text="Non-custodial approach with transparent policies."
                />
              </Reveal>
              <Reveal>
                <Feature
                  icon={<Gauge className="h-5 w-5 text-cyan-300" />}
                  title="Quality boosts"
                  text="Higher uptime & better latency can improve rewards."
                />
              </Reveal>
              <Reveal>
                <Feature
                  icon={<Users2 className="h-5 w-5 text-indigo-300" />}
                  title="Fair referrals"
                  text="Invite friends and earn bonuses via published rules."
                />
              </Reveal>
              <Reveal>
                <Feature
                  icon={<Wallet className="h-5 w-5 text-sky-300" />}
                  title="Clear conversion"
                  text="Points → SLK conversion rules are documented."
                />
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>

      {/* TRUST / CHECKLIST */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h3 className="text-lg font-semibold">What you get from day one</h3>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-slate-300 text-sm">
                <Reveal>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Real-time points accrual
                  </li>
                </Reveal>
                <Reveal>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Quality & Trust insights
                  </li>
                </Reveal>
                <Reveal>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Referral link (one-click)
                  </li>
                </Reveal>
                <Reveal>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    Non-custodial by design
                  </li>
                </Reveal>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/50 to-slate-950 p-6">
              <h3 className="text-lg font-semibold">Trust & transparency</h3>
              <p className="mt-2 text-sm text-slate-400">
                We keep the messaging conservative: conversion rules, referral program terms,
                and policies should be easy to find and consistent.
              </p>
              <div className="mt-4 grid gap-2">
                <Link
                  href="/tokenomics"
                  className="rounded-xl border border-slate-800 px-4 py-2 text-sm hover:bg-slate-900/60 transition"
                >
                  View tokenomics
                </Link>
                <Link
                  href="/docs"
                  className="rounded-xl border border-slate-800 px-4 py-2 text-sm hover:bg-slate-900/60 transition"
                >
                  Read docs
                </Link>
                <Link
                  href="/contact"
                  className="rounded-xl border border-slate-800 px-4 py-2 text-sm hover:bg-slate-900/60 transition"
                >
                  Contact
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold">FAQ</h2>
            <div className="mt-4 space-y-3">
              <Reveal>
                <Faq
                  q="How do rewards work?"
                  a="You earn points based on contribution and quality signals (e.g., uptime/latency). Points may be converted to SLK following the published conversion rules."
                />
              </Reveal>
              <Reveal>
                <Faq
                  q="Is my traffic private?"
                  a="Solink is designed as a non-custodial system: you control your device and configuration. For details, refer to the published policies and docs."
                />
              </Reveal>
              <Reveal>
                <Faq
                  q="Can I invite friends?"
                  a="Yes. Share your referral link from the dashboard. Referral bonuses follow the program rules."
                />
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FINAL CTA */}
      <section className="mx-auto max-w-7xl px-6 py-14">
        <Reveal>
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-cyan-900/30 to-sky-900/30 p-6 text-center">
            <h3 className="text-2xl font-semibold">Ready to start earning?</h3>
            <p className="text-slate-400 mt-1">Connect your device and see points flow in real time.</p>

            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium"
              >
                Open Dashboard
              </Link>
              <Link
                href="/download"
                className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3"
              >
                Download client
              </Link>
              <Link
                href="/contact"
                className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3"
              >
                Contact us
              </Link>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Disclaimer: metrics, rewards, and conversion may change during testnet as documented.
            </p>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}

/* ------------------------------ small parts ------------------------------ */

function Step({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2 font-medium">
        <span className="text-sky-300">{icon}</span>
        {title}
      </div>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        {icon}
        <div className="font-medium">{title}</div>
      </div>
      <p className="mt-2 text-sm text-slate-400">{text}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <summary className="cursor-pointer list-none font-medium">{q}</summary>
      <p className="mt-2 text-sm text-slate-400">{a}</p>
    </details>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-slate-800 p-3">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-slate-400">{label}</div>
    </div>
  );
}
