"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Coins, LineChart as LineIcon, ShieldCheck } from "lucide-react";

// ---------------- Data ----------------
const TOTAL_SUPPLY = 1_000_000_000;

const DISTRIBUTION = [
  {
    name: "Private Sale (15%)",
    value: 15,
    color: "#8b5cf6",
    details: "Cliff: 6 months after TGE • Vesting: Linear 12 months (1/12 each month)",
  },
  {
    name: "Public Sale (10%)",
    value: 10,
    color: "#22c55e",
    details: "Unlock: 100% at TGE (market liquidity)",
  },
  {
    name: "Team & Advisors (20%)",
    value: 20,
    color: "#f59e0b",
    details: "Cliff: 12 months after TGE • Vesting: Linear 24 months (1/24 each month)",
  },
  {
    name: "Community & Ecosystem (30%)",
    value: 30,
    color: "#60a5fa",
    details:
      "For Airdrops, Rewards, Staking Incentives • Released in campaigns • Expected full distribution within 36 months",
  },
  {
    name: "Treasury & Reserve (15%)",
    value: 15,
    color: "#10b981",
    details:
      "Cliff: 3 months after TGE • Unlock on-demand (Emergency/Partnerships) • Controlled by DAO Governance",
  },
  {
    name: "Marketing & Partnerships (10%)",
    value: 10,
    color: "#e879f9",
    details: "Unlock: 20% at TGE • Remaining vested linearly over 12 months",
  },
];

const VESTING_MILESTONES = [
  { t: "TGE", title: "≈12% circulating", body: "Public + part of Marketing unlocked" },
  { t: "Month 6", title: "Private Sale cliff ends", body: "Start 12-month linear unlock" },
  { t: "Month 12", title: "Team cliff ends", body: "Start 24-month linear unlock" },
  { t: "Month 36", title: "Community fully distributed", body: "Campaign-based releases complete" },
];

const FAQ_DATA = [
  {
    q: "How does vesting prevent dumping?",
    a: "By using cliffs + linear vesting schedules for major allocations and campaign-based releases for community rewards.",
  },
  {
    q: "What happens after community rewards are exhausted?",
    a: "Token demand will be sustained by real utility (payments, discounts) and DAO-controlled Treasury mechanisms.",
  },
];

// ----- Extra datasets (unchanged demo) -----
const VESTING_SERIES = [
  { m: 0,  privateSale: 0,   team: 0, community: 2,  total: 12 },
  { m: 6,  privateSale: 2,   team: 0, community: 5,  total: 17 },
  { m: 12, privateSale: 7.5, team: 0, community: 10, total: 27.5 },
  { m: 18, privateSale: 15,  team: 5, community: 15, total: 45 },
  { m: 24, privateSale: 15,  team: 10, community: 20, total: 55 },
  { m: 36, privateSale: 15,  team: 20, community: 30, total: 75 },
].map((d) => ({ ...d, label: `M${d.m}` }));

const EMISSIONS_SERIES = Array.from({ length: 13 }, (_, i) => {
  const year = i;
  const emissions = Math.max(0, Math.round(100 - year * 8 + (year % 3 === 0 ? 6 : 0)));
  return { year: `Y${year}`, emissions };
});

const QUARTERLY_ALLOC = [
  { q: "Q1", rewards: 60, staking: 25, quests: 10, referral: 5 },
  { q: "Q2", rewards: 55, staking: 25, quests: 15, referral: 5 },
  { q: "Q3", rewards: 50, staking: 30, quests: 15, referral: 5 },
  { q: "Q4", rewards: 45, staking: 35, quests: 15, referral: 5 },
];

// ---------------- Helpers ----------------
function formatNumber(n: number) {
  return n.toLocaleString();
}

function Counter({
  from = 0,
  to = 100,
  duration = 1.6,
  className = "",
}: {
  from?: number;
  to?: number;
  duration?: number;
  className?: string;
}) {
  const [val, setVal] = useState(from);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const p = Math.min(1, (ts - startRef.current) / (duration * 1000));
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [from, to, duration]);
  return <span className={className}>{formatNumber(val)}</span>;
}

function Section({
  children,
  className = "",
}: React.PropsWithChildren<{ className?: string }>) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/10 rounded-2xl border border-white/10 overflow-hidden">
      {items.map((it, idx) => (
        <div key={idx} className="bg-white/5 backdrop-blur">
          <button
            onClick={() => setOpen(open === idx ? null : idx)}
            className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-white/10 transition"
          >
            <span className="font-medium">{it.q}</span>
            <ArrowRight
              className={`size-5 transition-transform ${
                open === idx ? "rotate-90" : ""
              }`}
            />
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ${
              open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden px-5 pb-5 text-sm text-white/80">
              {it.a}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="rounded-xl bg-white/10 p-2">{icon}</div>
      <div>
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-white">
          {value}
          {suffix ? <span className="text-white/60"> {suffix}</span> : null}
        </div>
      </div>
    </div>
  );
}

// ---------------- Page ----------------
export default function TokenomicsPage() {
  const totalPercent = useMemo(
    () => DISTRIBUTION.reduce((a, b) => a + b.value, 0),
    []
  );

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Glow BG */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* HERO */}
      <Section className="px-6 md:px-10 pt-20">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            Solink Tokenomics
          </h1>
          <p className="mt-4 text-white/80 max-w-prose">
            Transparent and utility-driven. Explore supply, distribution,
            vesting and emissions — with interactive charts.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <StatCard
              icon={<Coins className="size-5" />}
              label="Total Supply"
              value={<Counter to={TOTAL_SUPPLY} className="text-2xl font-semibold" />}
              suffix="SLK"
            />
            <StatCard
              icon={<LineIcon className="size-5" />}
              label="Circulating at TGE"
              value={"≈12%"}
            />
            <StatCard
              icon={<ShieldCheck className="size-5" />}
              label="Vesting Discipline"
              value={"Cliffs + Linear"}
            />
          </div>

          <div className="mt-8 flex gap-3">
            <a
              href="/whitepaper"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
            >
              Whitepaper <ArrowRight className="size-4" />
            </a>
            <a
              href="/presale"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              Presale <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </Section>

      {/* A) Donut — Distribution */}
      <Section className="px-6 md:px-10 py-16">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative h-80">
            {/* Overlay center to avoid Label typing issues */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold">Distribution</div>
                <div className="text-sm text-white/80">{totalPercent}%</div>
              </div>
            </div>

            <ResponsiveContainer>
              <PieChart>
                <Pie
                  dataKey="value"
                  data={DISTRIBUTION}
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={2}
                  stroke="#0f172a"
                >
                  {DISTRIBUTION.map((d, i) => (
                    <Cell key={i} fill={d.color} className="cursor-pointer" />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p: any = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-white/10 bg-slate-900/90 px-3 py-2 text-sm backdrop-blur-md">
                        <div className="font-semibold">{p.name}</div>
                        <div className="text-white/80">{p.details}</div>
                      </div>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Balanced Allocation</h2>
            <p className="text-white/80 max-w-prose">
              Supports growth, funds development, and ensures longevity.
            </p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DISTRIBUTION.map((d) => (
                <li
                  key={d.name}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 p-3"
                >
                  <span
                    className="mt-1 size-3 rounded-full"
                    style={{ background: d.color }}
                  />
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-white/70 text-sm">{d.details}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* B) Line — Vesting cumulative unlock */}
      <Section className="px-6 md:px-10 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">Vesting — Cumulative Unlock</h2>
        <p className="text-white/80 mt-2 max-w-prose">
            Unlocks designed to prevent sudden supply shocks and align incentives across stakeholders.
          </p>
          <div className="mt-6 h-80 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ResponsiveContainer>
              <LineChart data={VESTING_SERIES}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff22" />
                <XAxis dataKey="label" stroke="#ffffff88" />
                <YAxis unit="%" stroke="#ffffff88" />
                <Tooltip />
                <Legend />
                <ReferenceLine x="M6" stroke="#ffffff55" label={{ value: "Private Cliff End", fill: "#fff" }} />
                <ReferenceLine x="M12" stroke="#ffffff55" label={{ value: "Team Cliff End", fill: "#fff" }} />
                <Line type="monotone" dataKey="privateSale" name="Private Sale" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="team"        name="Team & Advisors" stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="community"   name="Community & Ecosystem" stroke="#60a5fa" strokeWidth={2} dot />
                <Line type="monotone" dataKey="total"       name="Total (approx)" stroke="#ffffff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* C) Area — Emissions curve */}
      <Section className="px-6 md:px-10 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">Emissions Curve (Adaptive)</h2>
          <p className="text-white/80 mt-2 max-w-prose">
            Base emission decay with periodic adjustments, subject to quarterly DAO review.
          </p>
          <div className="mt-6 h-80 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ResponsiveContainer>
              <AreaChart data={EMISSIONS_SERIES}>
                <defs>
                  <linearGradient id="gEm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff22" />
                <XAxis dataKey="year" stroke="#ffffff88" />
                <YAxis stroke="#ffffff88" />
                <Tooltip />
                <Area type="monotone" dataKey="emissions" stroke="#22d3ee" fill="url(#gEm)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* D) Stacked Bars — Quarterly allocation */}
      <Section className="px-6 md:px-10 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">Quarterly Allocation (Illustrative)</h2>
          <p className="text-white/80 mt-2 max-w-prose">
            Illustrative breakdown of rewards across sharing, staking, quests, and referral programs.
          </p>
          <div className="mt-6 h-80 rounded-2xl border border-white/10 bg-white/5 p-4">
            <ResponsiveContainer>
              <BarChart data={QUARTERLY_ALLOC}>
                <CartesianGrid strokeDasharray="4 4" stroke="#ffffff22" />
                <XAxis dataKey="q" stroke="#ffffff88" />
                <YAxis unit="%" stroke="#ffffff88" />
                <Tooltip />
                <Legend />
                <Bar dataKey="rewards" stackId="a" name="Sharing Rewards" fill="#22d3ee" />
                <Bar dataKey="staking" stackId="a" name="Staking" fill="#60a5fa" />
                <Bar dataKey="quests"  stackId="a" name="Quests" fill="#8b5cf6" />
                <Bar dataKey="referral" stackId="a" name="Referral" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="px-6 md:px-10 py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-semibold">FAQs</h2>
          <p className="text-white/80 mt-2">Investors & users ask these the most.</p>
          <div className="mt-6"><Accordion items={FAQ_DATA} /></div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="px-6 md:px-10 pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-gradient-to-tr from-fuchsia-600/20 to-cyan-500/20 p-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-semibold">Ready to join the network?</h3>
              <p className="text-white/80 mt-2">
                Participate in the presale, read the whitepaper, or start earning by sharing bandwidth.
              </p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <a href="/presale" className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition">
                Join Presale <ArrowRight className="size-4" />
              </a>
              <a href="/whitepaper" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition">
                Read Whitepaper <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </Section>

      <footer className="px-6 md:px-10 pb-12 text-center text-white/50 text-sm">
        © {new Date().getFullYear()} Solink Network
      </footer>
    </main>
  );
}
