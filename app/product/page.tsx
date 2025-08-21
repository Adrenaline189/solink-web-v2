import type { Metadata } from "next";
import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import { Shield, Zap, Globe2, BarChart3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Product — Solink",
  description: "Product overview and core capabilities.",
  robots: { index: false, follow: false },
};

const UPDATED = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const FEATURES = [
  {
    icon: <Zap className="h-5 w-5" />,
    title: "Instant Setup",
    desc: "Get started in minutes with a lightweight client and zero-code onboarding.",
  },
  {
    icon: <Globe2 className="h-5 w-5" />,
    title: "Global Network",
    desc: "Elastic routing across regions for resilience, performance, and cost efficiency.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Real-time Analytics",
    desc: "Track usage, performance, and payouts with transparent dashboards.",
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: "Enterprise-Grade Security",
    desc: "Encryption in transit, request signing, and granular policy controls.",
  },
];

export default function ProductPage({ params }: { params: { locale: string } }) {
  const { locale } = params;

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Product</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          Solink makes bandwidth sharing simple, secure, and rewarding—built for both developers and enterprises.
        </p>
        <div className="mt-3 text-xs text-slate-400">Last updated: {UPDATED}</div>
      </header>

      {/* Features */}
      <section className="mt-14">
        <SectionTitle title="Core capabilities" subtitle="What you can do with Solink—at a glance." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs">
                {f.icon}
                <span>{f.title}</span>
              </div>
              <p className="mt-3 text-slate-300">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section className="mt-16">
        <SectionTitle title="Modules" subtitle="Compose what you need—keep the rest out." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { name: "Routing", desc: "Policy-based routing with region pinning and fallback." },
            { name: "Earnings", desc: "Transparent rewards engine with anti-fraud protection." },
            { name: "Observability", desc: "Logs, metrics, and alerts—ready for your SOC." },
          ].map((m) => (
            <div key={m.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-lg font-medium text-white">{m.name}</h3>
              <p className="mt-2 text-slate-300">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-center">
        <h3 className="text-xl font-semibold text-white">Ready to try Solink?</h3>
        <p className="mt-2 text-slate-300">Request a guided demo or start a pilot tailored to your needs.</p>
        <div className="mt-4">
          <Link
            href={`/${locale}/contact`}
            className="inline-block rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
          >
            Request a demo
          </Link>
        </div>
      </section>
    </main>
  );
}
