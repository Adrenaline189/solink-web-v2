// app/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
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
} from "lucide-react";

export const metadata: Metadata = {
  title: "Solink — Share bandwidth. Earn rewards.",
  description: "Share bandwidth. Earn rewards.",
  robots: { index: true, follow: true },
};

export default function HomePage() {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  // JSON-LD (Website + Organization)
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

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <Reveal>
            <div>
              <p className="inline-block rounded-full border border-sky-700/40 bg-sky-900/20 px-3 py-1 text-xs text-sky-300">
                Public testnet
              </p>
              <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold leading-tight">
                Share bandwidth.{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-sky-500 bg-clip-text text-transparent">
                  Earn rewards.
                </span>
              </h1>
              <p className="text-slate-400 mt-4 text-lg">
                Plug in, contribute unused bandwidth, and earn SLK. Your data stays private, your node stays yours.
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href="/dashboard"
                  className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium transition"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="https://www.solink.network/presale"
                  className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3 transition"
                >
                  Presale
                </Link>
              </div>

              <div className="mt-4 text-sm text-slate-500">
                Invited? Use your link: <code className="text-slate-300">/r/&lt;code&gt;</code>
              </div>
            </div>
          </Reveal>

          <Reveal>
            <div className="rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/60 to-slate-950 p-6">
              <div className="text-slate-300 font-semibold mb-3">Why Solink?</div>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-400" />
                  <span>Non-custodial privacy — your device, your control</span>
                </li>
                <li className="flex items-start gap-2">
                  <Gauge className="mt-0.5 h-4 w-4 text-cyan-300" />
                  <span>Quality Factor & Trust Score to boost earnings</span>
                </li>
                <li className="flex items-start gap-2">
                  <Wallet className="mt-0.5 h-4 w-4 text-sky-300" />
                  <span>Transparent points → SLK conversion</span>
                </li>
                <li className="flex items-start gap-2">
                  <Users2 className="mt-0.5 h-4 w-4 text-indigo-300" />
                  <span>Invite &amp; earn with fair referral rewards</span>
                </li>
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
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <div>
            <h2 className="text-2xl font-semibold">How it works</h2>
            <p className="text-slate-400 mt-1">Three simple steps to start earning.</p>

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
                  text="Safely contribute idle bandwidth to the network."
                />
              </Reveal>
              <Reveal>
                <Step
                  icon={<Coins className="h-5 w-5" />}
                  title="3) Earn SLK"
                  text="Accrue points in real time and convert to SLK."
                />
              </Reveal>
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
                  title="Privacy first"
                  text="We don’t take custody; your data stays yours."
                />
              </Reveal>
              <Reveal>
                <Feature
                  icon={<Gauge className="h-5 w-5 text-cyan-300" />}
                  title="Quality boosts"
                  text="Better uptime & latency → higher QF & rewards."
                />
              </Reveal>
              <Reveal>
                <Feature
                  icon={<Users2 className="h-5 w-5 text-indigo-300" />}
                  title="Fair referrals"
                  text="Invite friends and share the upside together."
                />
              </Reveal>
              <Reveal>
                <Feature
                  icon={<Wallet className="h-5 w-5 text-sky-300" />}
                  title="Clear conversion"
                  text="Transparent points → SLK with no hidden rules."
                />
              </Reveal>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CREDIBILITY / CHECKLIST */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        <Reveal>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-lg font-semibold">What you get from day one</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-slate-300 text-sm">
              <Reveal>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Real-time points accrual
                </li>
              </Reveal>
              <Reveal>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Quality & Trust insights
                </li>
              </Reveal>
              <Reveal>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> One-click referral link
                </li>
              </Reveal>
              <Reveal>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Non-custodial by design
                </li>
              </Reveal>
            </ul>
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
                <Faq q="How do rewards work?" a="You earn points based on usage, quality, and uptime. Points can be converted to SLK." />
              </Reveal>
              <Reveal>
                <Faq q="Is my traffic private?" a="Yes. Solink is non-custodial and does not take control of your device or data." />
              </Reveal>
              <Reveal>
                <Faq q="Can I invite friends?" a="Absolutely. Share your referral link from the dashboard to earn bonus points." />
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
            <p className="text-slate-400 mt-1">
              Connect your device and see points flow in real time.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-sky-600/90 hover:bg-sky-600 px-5 py-3 font-medium"
              >
                Open Dashboard
              </Link>
              <Link
                href="/contact"
                className="rounded-2xl border border-slate-700 hover:bg-slate-900/60 px-5 py-3"
              >
                Contact us
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
}

/* ------------------------------ small parts ------------------------------ */

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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

function Feature({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
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
    <details className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <summary className="cursor-pointer list-none font-medium">
        {q}
      </summary>
      <p className="mt-2 text-sm text-slate-400">{a}</p>
    </details>
  );
}
