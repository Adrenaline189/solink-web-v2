"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
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
import {
  ArrowRight,
  Coins,
  LineChart as LineIcon,
  ShieldCheck,
  Sparkles,
  Layers,
  Wallet,
  TrendingUp,
} from "lucide-react";

/* ================== CONFIG ================== */
const TOTAL_SUPPLY = 1_000_000_000;

// ---- Sale Rounds (3 rounds) ----
const ROUNDS = [
  {
    name: "Seed",
    percent: 5,
    price: 0.005,
    cliff: "6m",
    vest: "12m",
    note: "Linear vest (1/12 monthly) after cliff",
  },
  {
    name: "Private",
    percent: 10,
    price: 0.010,
    cliff: "6m",
    vest: "12m",
    note: "Linear vest (1/12 monthly) after cliff",
  },
  {
    name: "Public",
    percent: 10,
    price: 0.020,
    cliff: "—",
    vest: "—",
    note: "100% unlock at TGE (liquidity)",
  },
];


// ---- Distribution (pie) ----
const DISTRIBUTION = [
  {
    name: "Seed (5%)",
    value: 5,
    color: "#a78bfa",
    details: "Cliff: 6 months after TGE • Vesting: Linear 12 months (1/12 each month)",
  },
  {
    name: "Private Sale (10%)",
    value: 10,
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

// ---- Demo series (unchanged) ----
const VESTING_SERIES = [
  { m: 0, privateSale: 0, team: 0, community: 2, total: 12 },
  { m: 6, privateSale: 2, team: 0, community: 5, total: 17 },
  { m: 12, privateSale: 7.5, team: 0, community: 10, total: 27.5 },
  { m: 18, privateSale: 15, team: 5, community: 15, total: 45 },
  { m: 24, privateSale: 15, team: 10, community: 20, total: 55 },
  { m: 36, privateSale: 15, team: 20, community: 30, total: 75 },
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

/* ================== HELPERS ================== */
function formatNumber(n: number) {
  return n.toLocaleString();
}
function usd(n: number) {
  return `${n.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDT`;
}
function money(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
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
  id,
}: React.PropsWithChildren<{ className?: string; id?: string }>) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function Chip({ children }: React.PropsWithChildren) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
      {children}
    </span>
  );
}

function GradientTitle({ children }: React.PropsWithChildren) {
  return (
    <span className="bg-gradient-to-r from-fuchsia-200 via-white to-cyan-200 bg-clip-text text-transparent">
      {children}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur transition hover:bg-white/10">
      <div className="rounded-xl bg-white/10 p-2 ring-1 ring-white/10">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-white text-lg leading-tight">{value}</div>
        {sub ? <div className="text-xs text-white/60 mt-0.5">{sub}</div> : null}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  desc,
  children,
  right,
}: React.PropsWithChildren<{ title: string; desc?: string; right?: React.ReactNode }>) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] hover:bg-white/10 transition">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="text-xl font-semibold">{title}</div>
          {desc ? <div className="mt-1 text-sm text-white/75 max-w-prose">{desc}</div> : null}
        </div>
        {right ? <div className="md:pt-1">{right}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

/**
 * NiceTooltip (NO inline style background)
 * - uses CSS variable for the color dot to avoid tooling warnings
 */
function NiceTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm backdrop-blur-xl shadow-lg">
      <div className="text-white/80">{label}</div>
      <div className="mt-2 space-y-1">
        {payload.map((p: any) => (
          <div key={p.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-white/80">
              <span
                className="size-2 rounded-full bg-[var(--dot-color)]"
                style={{ ["--dot-color" as any]: p.color }}
              />
              {p.name ?? p.dataKey}
            </span>

            <span className="text-white font-medium">
              {p.value}
              {typeof p.value === "number" && p.unit ? p.unit : ""}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-white/10 rounded-3xl border border-white/10 overflow-hidden bg-white/5 backdrop-blur">
      {items.map((it, idx) => (
        <div key={idx} className="group">
          <button
            onClick={() => setOpen(open === idx ? null : idx)}
            className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-white/10 transition"
          >
            <span className="font-medium">{it.q}</span>
            <ArrowRight className={`size-5 transition-transform ${open === idx ? "rotate-90" : ""}`} />
          </button>
          <div
            className={`grid transition-[grid-template-rows] duration-300 ${
              open === idx ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden px-5 pb-5 text-sm text-white/80 leading-relaxed">{it.a}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ================== PAGE ================== */
export default function TokenomicsPage() {
  const year = new Date().getFullYear();

  const totalPercent = useMemo(() => DISTRIBUTION.reduce((a, b) => a + b.value, 0), []);

  // Compute sale round aggregates
  const saleRows = useMemo(() => {
    return ROUNDS.map((r) => {
      const tokens = Math.round((r.percent / 100) * TOTAL_SUPPLY);
      const revenueUSDT = tokens * r.price;
      return { ...r, tokens, revenueUSDT };
    });
  }, []);

  const totals = useMemo(() => {
    const usdtTotal = saleRows.reduce((a, b) => a + b.revenueUSDT, 0);
    const tokensTotal = saleRows.reduce((a, b) => a + b.tokens, 0);
    return { usdtTotal, tokensTotal };
  }, [saleRows]);

  const FAQ_DATA = [
    { q: "What is the total supply of SLK?", a: "The total supply is 1,000,000,000 SLK." },
    {
      q: "How is the supply allocated?",
      a:
        "Seed 5%, Private Sale 10%, Public Sale 10%, Team & Advisors 20%, Community & Ecosystem 30%, Treasury & Reserve 15%, Marketing & Partnerships 10% (100% total).",
    },
    {
  q: "How many sale rounds are there and what are the prices?",
  a:
    "There are 3 rounds: Seed (5%) at $0.005 per SLK, Private (10%) at $0.010 per SLK, Public (10%) at $0.020 per SLK.",
},
{
  q: "How many tokens are sold and how much will be raised?",
  a:
    `Total sold across rounds ≈ ${formatNumber(totals.tokensTotal)} SLK (25% of supply). ` +
    `Expected raise ≈ ${usd(totals.usdtTotal)} in total.`,
},

    {
      q: "What unlocks at TGE?",
      a:
        "Public Sale tokens are 100% unlocked at TGE to provide market liquidity. Circulating supply at TGE depends on final launch parameters.",
    },
    {
      q: "How does vesting work for Seed and Private investors?",
      a: "Both Seed and Private have a 6-month cliff after TGE, followed by linear vesting over 12 months (1/12 monthly).",
    },
    {
      q: "What is the vesting schedule for Team & Advisors?",
      a: "12-month cliff after TGE, then linear vesting over 24 months (1/24 monthly).",
    },
    {
      q: "How are Marketing & Partnerships tokens released?",
      a: "20% unlock at TGE, with the remaining 80% vesting linearly over 12 months.",
    },
    { q: "How is the Treasury & Reserve managed?", a: "3-month cliff after TGE; unlocks on-demand under DAO governance." },
    { q: "What does “TGE” mean?", a: "Token Generation Event — when tokens are minted and vesting schedules begin." },
  ];

  const NAV = [
    { id: "distribution", label: "Distribution" },
    { id: "sale", label: "Sale Rounds" },
    { id: "vesting", label: "Vesting" },
    { id: "emissions", label: "Emissions" },
    { id: "allocation", label: "Allocation" },
    { id: "faq", label: "FAQ" },
  ];

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Background glow + subtle grid */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      {/* Sticky top nav */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/60 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Layers className="size-5 text-white/90" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Tokenomics</div>
              <div className="text-[11px] text-white/60 truncate">SLK • Supply • Vesting • Emissions</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => scrollToId(n.id)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10 transition"
              >
                {n.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/whitepaper"
              className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-3 py-2 text-xs font-semibold hover:bg-white/90 transition"
            >
              Whitepaper <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/presale"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
            >
              Presale <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* HERO */}
      <Section className="px-6 md:px-10 pt-14 pb-10" id="top">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-wrap items-center gap-2">
            <Chip>
              <Sparkles className="size-4" /> Public testnet
            </Chip>
            <Chip>
              <ShieldCheck className="size-4" /> Cliffs + Linear vesting
            </Chip>
            <Chip>
              <TrendingUp className="size-4" /> Transparent allocation
            </Chip>
          </div>

          <h1 className="mt-5 text-4xl md:text-6xl font-bold tracking-tight">
            <GradientTitle>Solink Tokenomics</GradientTitle>
          </h1>

          <p className="mt-4 text-white/75 max-w-2xl leading-relaxed">
            Transparent and utility-driven. Explore supply, distribution, vesting and emissions — with interactive charts.
          </p>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <StatCard
              icon={<Coins className="size-5" />}
              label="Total Supply"
              value={
                <span className="text-2xl font-semibold">
                  <Counter to={TOTAL_SUPPLY} />
                </span>
              }
              sub="SLK"
            />
            <StatCard
              icon={<LineIcon className="size-5" />}
              label="Circulating at TGE"
              value={<span className="text-2xl font-semibold">≈12%</span>}
              sub="Illustrative"
            />
            <StatCard
              icon={<Wallet className="size-5" />}
              label="Sale Rounds"
              value={<span className="text-2xl font-semibold">3</span>}
              sub="25% of supply"
            />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={() => scrollToId("distribution")}
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
            >
              Explore charts <ArrowRight className="size-4" />
            </button>
            <Link
              href="/whitepaper"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
            >
              Read Whitepaper <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </Section>

      {/* A) Donut — Distribution */}
      <Section className="px-6 md:px-10 py-12" id="distribution">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-2 gap-8 items-start">
          <ChartCard
            title="Distribution"
            desc="Balanced allocation designed for growth, development and long-term sustainability."
            right={
              <Chip>
                Total: <span className="text-white font-semibold">{totalPercent}%</span>
              </Chip>
            }
          >
            <div className="relative h-[340px]">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold">100%</div>
                  <div className="text-xs text-white/70">Total allocation</div>
                </div>
              </div>

              <ResponsiveContainer>
                <PieChart>
                  <Pie dataKey="value" data={DISTRIBUTION} innerRadius={90} outerRadius={135} paddingAngle={2} stroke="#0b1220">
                    {DISTRIBUTION.map((d, i) => (
                      <Cell key={i} fill={d.color} className="cursor-pointer" />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const p: any = payload[0].payload;
                      return (
                        <div className="rounded-2xl border border-white/10 bg-slate-950/90 px-4 py-3 text-sm backdrop-blur-xl shadow-lg">
                          <div className="font-semibold">{p.name}</div>
                          <div className="mt-1 text-white/80 leading-relaxed">{p.details}</div>
                        </div>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur p-5 md:p-6">
              <div className="text-xl font-semibold">Allocation details</div>
              <p className="mt-2 text-sm text-white/75">Each bucket has a release strategy to reduce supply shocks and align incentives.</p>

              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {DISTRIBUTION.map((d) => (
                  <li
                    key={d.name}
                    className="group flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 hover:bg-white/10 transition"
                  >
                    {/* dot color via CSS variable (no inline background) */}
                    <span className="mt-1.5 size-3 rounded-full bg-[var(--dot-color)]" style={{ ["--dot-color" as any]: d.color }} />
                    <div className="min-w-0">
                      <div className="font-medium">{d.name}</div>
                      <div className="text-white/70 text-sm leading-relaxed">{d.details}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-3xl border border-white/10 bg-gradient-to-tr from-fuchsia-600/15 to-cyan-500/15 p-5 md:p-6">
              <div className="text-sm text-white/75">Quick note</div>
              <div className="mt-1 text-lg font-semibold">Transparency over hype</div>
              <p className="mt-2 text-sm text-white/75 leading-relaxed">
                Figures and unlock assumptions should be treated as illustrative until the final launch parameters are published.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* Sale Rounds & Revenue */}
      <Section className="px-6 md:px-10 py-12" id="sale">
        <div className="mx-auto max-w-6xl">
          <ChartCard
            title="Sale Rounds & Revenue"
            desc="Three rounds totaling 25% of supply. Live calculation of tokens and expected revenue in USDT."
            right={
              <div className="flex flex-wrap gap-2">
                <Chip>
                  Sold: <span className="font-semibold">{formatNumber(totals.tokensTotal)} SLK</span>
                </Chip>
                <Chip>
                  Raise: <span className="font-semibold">{money(totals.usdtTotal)}</span>
                </Chip>
              </div>
            }
          >
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-[820px] w-full text-sm">
                <thead>
                  <tr className="bg-white/10">
                    <th className="px-4 py-3 text-left font-medium">Round</th>
                    <th className="px-4 py-3 text-right font-medium">Allocation</th>
                    <th className="px-4 py-3 text-right font-medium">Tokens (SLK)</th>
                    <th className="px-4 py-3 text-right font-medium">Price / SLK</th>
                    <th className="px-4 py-3 text-right font-medium">Revenue (USDT)</th>
                    <th className="px-4 py-3 text-left font-medium">Vesting</th>
                  </tr>
                </thead>
                <tbody>
                  {saleRows.map((r) => (
                    <tr key={r.name} className="border-t border-white/10">
                      <td className="px-4 py-3">{r.name}</td>
                      <td className="px-4 py-3 text-right">{r.percent}%</td>
                      <td className="px-4 py-3 text-right">{formatNumber(r.tokens)}</td>
                      <td className="px-4 py-3 text-right">${r.price.toFixed(3)}</td>
                      <td className="px-4 py-3 text-right">{usd(r.revenueUSDT)}</td>
                      <td className="px-4 py-3 text-white/80">{r.cliff === "—" ? r.note : `Cliff ${r.cliff} • Vest ${r.vest} • ${r.note}`}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-white/10 bg-white/5 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right">{ROUNDS.reduce((a, b) => a + b.percent, 0)}%</td>
                    <td className="px-4 py-3 text-right">{formatNumber(totals.tokensTotal)}</td>
                    <td className="px-4 py-3 text-right">—</td>
                    <td className="px-4 py-3 text-right">{usd(totals.usdtTotal)}</td>
                    <td className="px-4 py-3">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </ChartCard>
        </div>
      </Section>

      {/* Vesting */}
      <Section className="px-6 md:px-10 py-12" id="vesting">
        <div className="mx-auto max-w-6xl">
          <ChartCard title="Vesting — Cumulative Unlock" desc="Unlocks designed to prevent sudden supply shocks and align incentives across stakeholders.">
            <div className="h-[360px] rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <ResponsiveContainer>
                <LineChart data={VESTING_SERIES}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff22" />
                  <XAxis dataKey="label" stroke="#ffffff88" />
                  <YAxis unit="%" stroke="#ffffff88" />
                  <Tooltip content={<NiceTooltip />} />
                  <Legend />
                  <ReferenceLine x="M6" stroke="#ffffff55" />
                  <ReferenceLine x="M12" stroke="#ffffff55" />
                  <Line type="monotone" dataKey="privateSale" name="Private Sale" stroke="#8b5cf6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="team" name="Team & Advisors" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="community" name="Community & Ecosystem" stroke="#60a5fa" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="total" name="Total (approx)" stroke="#ffffff" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 text-xs text-white/60">
              Notes: Reference lines indicate cliff milestones (illustrative). Final unlock timeline may vary by launch parameters.
            </div>
          </ChartCard>
        </div>
      </Section>

      {/* Emissions */}
      <Section className="px-6 md:px-10 py-12" id="emissions">
        <div className="mx-auto max-w-6xl">
          <ChartCard title="Emissions Curve (Adaptive)" desc="Base emission decay with periodic adjustments, subject to quarterly DAO review.">
            <div className="h-[360px] rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <ResponsiveContainer>
                <AreaChart data={EMISSIONS_SERIES}>
                  <defs>
                    <linearGradient id="gEm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff22" />
                  <XAxis dataKey="year" stroke="#ffffff88" />
                  <YAxis stroke="#ffffff88" />
                  <Tooltip content={<NiceTooltip />} />
                  <Area type="monotone" dataKey="emissions" name="Emissions" stroke="#22d3ee" fill="url(#gEm)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </Section>

      {/* Allocation */}
      <Section className="px-6 md:px-10 py-12" id="allocation">
        <div className="mx-auto max-w-6xl">
          <ChartCard title="Quarterly Allocation (Illustrative)" desc="Illustrative breakdown of rewards across sharing, staking, quests, and referral programs.">
            <div className="h-[360px] rounded-2xl border border-white/10 bg-slate-950/20 p-4">
              <ResponsiveContainer>
                <BarChart data={QUARTERLY_ALLOC}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#ffffff22" />
                  <XAxis dataKey="q" stroke="#ffffff88" />
                  <YAxis unit="%" stroke="#ffffff88" />
                  <Tooltip content={<NiceTooltip />} />
                  <Legend />
                  <Bar dataKey="rewards" stackId="a" name="Sharing Rewards" fill="#22d3ee" />
                  <Bar dataKey="staking" stackId="a" name="Staking" fill="#60a5fa" />
                  <Bar dataKey="quests" stackId="a" name="Quests" fill="#8b5cf6" />
                  <Bar dataKey="referral" stackId="a" name="Referral" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="px-6 md:px-10 py-12" id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold">FAQs</h2>
              <p className="text-white/75 mt-2">Most common questions from investors & users.</p>
            </div>
            <button
              onClick={() => scrollToId("top")}
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
            >
              Back to top <ArrowRight className="size-4 rotate-[-90deg]" />
            </button>
          </div>

          <div className="mt-6">
            <Accordion items={FAQ_DATA} />
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="px-6 md:px-10 pb-20">
        <div className="mx-auto max-w-6xl rounded-[28px] border border-white/10 bg-gradient-to-tr from-fuchsia-600/20 to-cyan-500/20 p-7 md:p-10 backdrop-blur">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-semibold">Ready to join the network?</h3>
              <p className="text-white/80 mt-2 leading-relaxed">
                Participate in the presale, read the whitepaper, or start earning by sharing bandwidth.
              </p>
            </div>
            <div className="flex gap-3 md:justify-end flex-wrap">
              <Link
                href="/presale"
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
              >
                Join Presale <ArrowRight className="size-4" />
              </Link>
              <Link
                href="/whitepaper"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Read Whitepaper <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </Section>

      <footer className="px-6 md:px-10 pb-10 text-center text-white/50 text-sm">© {year} Solink Network</footer>
    </main>
  );
}
