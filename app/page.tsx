import { Suspense } from 'react';
"use client";
export const dynamic = 'force-dynamic';

import Link from "next/link";
import { useLang } from "@/lib/useLang";
import { t } from "@/lib/i18n";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

/** Mock tokenomics for the mini pie */
const TOKEN_SPLIT = [
  { name: "Private", value: 15, color: "#22d3ee" },
  { name: "Community", value: 35, color: "#6366f1" },
  { name: "Ecosystem", value: 20, color: "#10b981" },
  { name: "Treasury", value: 10, color: "#f59e0b" },
  { name: "Team", value: 20, color: "#ef4444" }
];

/** Mock live stats */
const LIVE_STATS = [
  { labelKey: "landing.stats.nodes", value: "23,418" },
  { labelKey: "landing.stats.bandwidth", value: "128 Gbps" },
  { labelKey: "landing.stats.countries", value: "92" }
];

function LandingPageInner() {
  const [lang] = useLang();

  return (
    <div className="bg-slate-950 text-slate-100">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(34,211,238,0.25),transparent_60%)]" />
        <div className="mx-auto max-w-6xl px-6 pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-300">
            <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-400" />
            {t(lang, "landing.badge")}
          </div>

          <h1 className="mt-5 text-5xl font-extrabold tracking-tight sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-400">
            {t(lang, "landing.title")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            {t(lang, "landing.subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-2xl bg-cyan-500 px-6 py-3 text-lg font-semibold text-white shadow-lg hover:bg-cyan-600"
            >
              {t(lang, "landing.getStarted")}
            </Link>
            <a
              href="#how"
              className="rounded-2xl border border-slate-700 bg-slate-900 px-6 py-3 text-lg font-semibold hover:bg-slate-800"
            >
              {t(lang, "landing.learnMore")}
            </a>
          </div>

          {/* Logos / Social proof */}
          <div className="mx-auto mt-10 max-w-4xl opacity-70">
            <p className="mb-4 text-xs uppercase tracking-widest text-slate-400">
              {t(lang, "landing.trustedBy")}
            </p>
            <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
              {["Solana", "Arweave", "IPFS", "Helium", "Eigen", "Filecoin"].map((brand) => (
                <div
                  key={brand}
                  className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 text-center text-xs"
                >
                  {brand}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* LIVE STATS BAR */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="mx-auto grid max-w-6xl grid-cols-3 divide-x divide-slate-800 text-center">
          {LIVE_STATS.map((s, i) => (
            <div key={i} className="p-5">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-slate-400">{t(lang, s.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">{t(lang, "landing.featuresTitle")}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-center text-slate-400">
          {t(lang, "landing.featuresDesc")}
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title={t(lang, "landing.feature1Title")}
            desc={t(lang, "landing.feature1Desc")}
          />
          <Feature
            title={t(lang, "landing.feature2Title")}
            desc={t(lang, "landing.feature2Desc")}
          />
          <Feature
            title={t(lang, "landing.feature3Title")}
            desc={t(lang, "landing.feature3Desc")}
          />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="bg-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-center text-3xl font-bold">{t(lang, "landing.howTitle")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
            <Step index="①" title={t(lang, "landing.how1Title")} desc={t(lang, "landing.how1Desc")} />
            <Step index="②" title={t(lang, "landing.how2Title")} desc={t(lang, "landing.how2Desc")} />
            <Step index="③" title={t(lang, "landing.how3Title")} desc={t(lang, "landing.how3Desc")} />
          </div>
        </div>
      </section>

      {/* TOKENOMICS MINI + ROADMAP */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
          {/* Tokenomics mini chart */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-xl font-semibold">{t(lang, "landing.tokenomicsTitle")}</h3>
            <p className="mt-1 text-sm text-slate-400">{t(lang, "landing.tokenomicsSub")}</p>
            <div className="mt-4 h-56 w-full">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={TOKEN_SPLIT} dataKey="value" nameKey="name" outerRadius={90}>
                    {TOKEN_SPLIT.map((s, i) => (
                      <Cell key={i} fill={s.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#0f172a", border: "1px solid #1f2937", color: "white" }}
                    formatter={(val: any, name: string) => [`${val}%`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {TOKEN_SPLIT.map((s) => (
                <li key={s.name} className="flex items-center gap-2">
                  <span className="inline-block h-3 w-3 rounded-sm" style={{ background: s.color }} />
                  <span className="text-slate-300">{t(lang, `landing.token.${s.name.toLowerCase()}`)}</span>
                  <span className="ml-auto text-slate-400">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roadmap */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h3 className="text-xl font-semibold">{t(lang, "landing.roadmapTitle")}</h3>
            <ol className="mt-4 space-y-4">
              <RoadItem q="Q1" text={t(lang, "landing.roadmap.q1")} />
              <RoadItem q="Q2" text={t(lang, "landing.roadmap.q2")} />
              <RoadItem q="Q3" text={t(lang, "landing.roadmap.q3")} />
              <RoadItem q="Q4" text={t(lang, "landing.roadmap.q4")} />
            </ol>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="border-y border-slate-800 bg-slate-900">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">
          <h3 className="text-2xl font-semibold">{t(lang, "landing.newsTitle")}</h3>
          <p className="mt-1 text-slate-400">{t(lang, "landing.newsSub")}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert(t(lang, "landing.newsMock"));
            }}
            className="mx-auto mt-6 flex max-w-md gap-2"
          >
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950/60 px-4 py-3 text-sm outline-none ring-0 placeholder:text-slate-500 focus:border-slate-600"
            />
            <button className="rounded-2xl bg-indigo-500 px-5 text-white hover:bg-indigo-600">
              {t(lang, "landing.newsCta")}
            </button>
          </form>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-3xl font-bold">{t(lang, "landing.faqTitle")}</h2>
        <div className="mt-8 space-y-4">
          <FAQ q={t(lang, "landing.faq.q1")} a={t(lang, "landing.faq.a1")} />
          <FAQ q={t(lang, "landing.faq.q2")} a={t(lang, "landing.faq.a2")} />
          <FAQ q={t(lang, "landing.faq.q3")} a={t(lang, "landing.faq.a3")} />
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 py-10 text-center text-slate-400">
        <p>© 2025 Solink • {t(lang, "landing.footer")}</p>
        <div className="mt-2 space-x-4">
          <a href="#" className="hover:text-slate-200">{t(lang, "landing.link.docs")}</a>
          <a href="#" className="hover:text-slate-200">{t(lang, "landing.link.whitepaper")}</a>
          <a href="#" className="hover:text-slate-200">{t(lang, "landing.link.contact")}</a>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Small subcomponents ---------- */
function Feature({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 transition hover:border-slate-700">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function Step({ index, title, desc }: { index: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
      <div className="text-3xl">{index}</div>
      <h4 className="mt-2 text-xl font-semibold">{title}</h4>
      <p className="mt-1 text-sm text-slate-400">{desc}</p>
    </div>
  );
}

function RoadItem({ q, text }: { q: string; text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-0.5 h-6 w-12 rounded-full bg-slate-800 text-center text-sm font-semibold text-slate-300">{q}</div>
      <div className="text-slate-300">{text}</div>
    </li>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <summary className="cursor-pointer list-none text-sm font-semibold">
        {q}
      </summary>
      <p className="mt-2 text-sm text-slate-400">{a}</p>
    </details>
  );
}


export default function LandingPage() {
  return (
    <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
      <LandingPageInner />
    </Suspense>
  );
}
