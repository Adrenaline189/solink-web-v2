"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Clock,
  Coins,
  Flame,
  ShieldCheck,
  Wallet as WalletIcon,
  CheckCircle2,
  ExternalLink,
  Info,
} from "lucide-react";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";

import SolanaConnectButton from "@/components/SolanaConnectButton";

/* ---------- Config: Phases ---------- */
type Phase = {
  key: string;
  label: string;
  start: string;
  end: string;
  priceUsd: number;
  hardCapUsd: number;
  softCapUsd?: number;
  percent: number;
};

// ✅ ปีนี้ (Bangkok +07:00) แต่จะแสดงผลเป็น UTC (ด้านล่าง)
const YEAR = new Date().getFullYear();
const TZ = "+07:00";

/**
 * ✅ Schedule (เวลาไทย 19:00):
 * - Seed:    Apr 1 → Apr 7
 * - Private: Apr 7 → Apr 13
 * - Public:  Apr 13 → Apr 19
 *
 * Override วันเริ่มรอบแรก: NEXT_PUBLIC_PRESALE_START
 */
const PHASES: Phase[] = [
  {
    key: "seed",
    label: "Seed",
    start: process.env.NEXT_PUBLIC_PRESALE_START ?? `${YEAR}-04-01T19:00:00${TZ}`,
    end: `${YEAR}-04-07T19:00:00${TZ}`,
    priceUsd: 0.005,
    hardCapUsd: 250_000,
    softCapUsd: 100_000,
    percent: 5,
  },
  {
    key: "private",
    label: "Private",
    start: `${YEAR}-04-07T19:00:00${TZ}`,
    end: `${YEAR}-04-13T19:00:00${TZ}`,
    priceUsd: 0.01,
    hardCapUsd: 500_000,
    softCapUsd: 200_000,
    percent: 10,
  },
  {
    key: "public",
    label: "Public",
    start: `${YEAR}-04-13T19:00:00${TZ}`,
    end: `${YEAR}-04-19T19:00:00${TZ}`,
    priceUsd: 0.02,
    hardCapUsd: 1_000_000,
    softCapUsd: 300_000,
    percent: 10,
  },
];

const SOL_TREASURY = process.env.NEXT_PUBLIC_SOLANA_TREASURY || "11111111111111111111111111111111";

/* Hydration-safe date format (UTC for everyone) */
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
  calendar: "gregory",
  numberingSystem: "latn",
});

/* ---------- Helpers ---------- */
function pad(n: number) {
  return n.toString().padStart(2, "0");
}
function formatDate(d: Date) {
  return dateFmt.format(d);
}
function money(n: number) {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function Section({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function useNow() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

function getActivePhase(nowMs: number | null) {
  const phases = PHASES.map((p) => ({
    ...p,
    startMs: new Date(p.start).getTime(),
    endMs: new Date(p.end).getTime(),
  }));
  if (nowMs == null) return phases.find((p) => Date.now() < p.startMs) || phases[0];
  return (
    phases.find((p) => nowMs >= p.startMs && nowMs < p.endMs) ||
    phases.find((p) => nowMs < p.startMs) ||
    phases[phases.length - 1]
  );
}

function countdown(targetMs: number, nowMs: number | null) {
  if (nowMs == null) {
    return { days: "--", hours: "--", minutes: "--", seconds: "--", total: null as null | number };
  }
  const diff = Math.max(0, Math.floor((targetMs - nowMs) / 1000));
  return {
    days: pad(Math.floor(diff / 86400)),
    hours: pad(Math.floor((diff % 86400) / 3600)),
    minutes: pad(Math.floor((diff % 3600) / 60)),
    seconds: pad(diff % 60),
    total: diff,
  };
}

/* ---------- PAGE (Solana only) ---------- */
export default function PresaleSolanaOnlyPage() {
  const nowMs = useNow();
  const active = getActivePhase(nowMs);

  const start = useMemo(() => new Date(active.start), [active.start]);
  const end = useMemo(() => new Date(active.end), [active.end]);

  const mode =
    nowMs == null
      ? "pre"
      : nowMs < start.getTime()
      ? "pre"
      : nowMs < end.getTime()
      ? "live"
      : "ended";

  const target = mode === "pre" ? start.getTime() : end.getTime();
  const c = countdown(target, nowMs);

  // demo progress (?sold=)
  const [soldUSD, setSoldUSD] = useState<number>(0);
  useEffect(() => {
    const s = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("sold") : null;
    if (s && !Number.isNaN(Number(s))) setSoldUSD(Number(s));
  }, []);
  const progressPct = Math.min(100, (soldUSD / active.hardCapUsd) * 100);

  const [contribUSD, setContribUSD] = useState<number>(1000);
  const tokensPerUSD = 1 / active.priceUsd;
  const estTokens = Math.floor(contribUSD * tokensPerUSD);
  const estTokensLabel = estTokens.toLocaleString("en-US");

  // NOTE: demo rate — replace later with oracle
  const USD_PER_SOL = 150;
  const solValue = contribUSD / USD_PER_SOL;

  const { connection } = useConnection();
  const { publicKey, sendTransaction, connecting, connected } = useWallet();

  async function onBuySolana() {
    if (!publicKey) return alert("Connect Solana wallet first.");
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: new PublicKey(SOL_TREASURY),
          lamports: Math.round(solValue * LAMPORTS_PER_SOL),
        })
      );
      const sig = await sendTransaction(tx, connection);
      alert(`Tx submitted: ${sig}`);
    } catch (e: any) {
      alert(e?.message || "Solana transaction failed");
    }
  }

  const phaseLabel =
    mode === "pre" ? `${active.label} starts in` : mode === "live" ? `${active.label} ends in` : `${active.label} ended`;

  const statusBadge = mode === "live" ? "Live" : mode === "pre" ? "Upcoming" : "Ended";

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-28 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.10] [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/55 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 md:px-10 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-9 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center">
              <Flame className="size-5 text-fuchsia-300" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">Solink Presale</div>
              <div className="text-[11px] text-white/60 truncate">
                Solana • {active.label} • {statusBadge}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/whitepaper"
              className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold hover:bg-white/10 transition"
            >
              Whitepaper <ExternalLink className="size-4" />
            </a>
            {/* ✅ connect only once (header) */}
            <SolanaConnectButton />
          </div>
        </div>
      </div>

      {/* Hero */}
      <Section className="px-6 md:px-10 pt-10">
        {/* ✅ items-stretch = both columns same height */}
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.15fr,0.85fr] gap-8 items-stretch">
          {/* Left (full height) */}
          <div className="h-full flex flex-col">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <ShieldCheck className="size-4 text-emerald-300" />
                Anti-spam • Wallet-based
              </span>

              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
                <CalendarDays className="size-4 text-cyan-200" />
                Starts Apr 1, {YEAR} (TH)
              </span>

              <span
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                  mode === "live"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : mode === "pre"
                    ? "border-cyan-400/30 bg-cyan-500/10 text-cyan-100"
                    : "border-white/10 bg-white/5 text-white/70"
                }`}
              >
                <span
                  className={`size-1.5 rounded-full ${
                    mode === "live" ? "bg-emerald-300" : mode === "pre" ? "bg-cyan-200" : "bg-white/40"
                  }`}
                />
                {statusBadge}
              </span>
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-bold tracking-tight">
              {active.label} Round
              <span className="text-white/60"> • </span>
              <span className="bg-gradient-to-r from-fuchsia-200 via-white to-cyan-200 bg-clip-text text-transparent">
                Solana Presale
              </span>
            </h1>

            <p className="mt-3 text-white/75 max-w-prose leading-relaxed">
              Join the decentralized bandwidth-sharing network. Transparent rounds, clear caps, and on-chain contribution.
            </p>

            {/* ✅ this card stretches to match right column height */}
            <div className="mt-6 flex-1 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur flex flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-white/70">
                  <Clock className="size-5" />
                  <span className="text-sm">{phaseLabel}</span>
                </div>

                <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
                  <Info className="size-4" />
                  UTC time
                </div>
              </div>

              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                <TimeBox label="Days" value={c.days} />
                <TimeBox label="Hours" value={c.hours} />
                <TimeBox label="Minutes" value={c.minutes} />
                <TimeBox label="Seconds" value={c.seconds} />
              </div>

              <div className="mt-4 grid sm:grid-cols-3 gap-3">
                <StatCard icon={<CalendarDays className="size-5" />} label="Start" value={formatDate(start)} />
                <StatCard icon={<CalendarDays className="size-5" />} label="End" value={formatDate(end)} />
                <StatCard icon={<Coins className="size-5" />} label="Price" value={`$${active.priceUsd.toFixed(4)} / SLK`} />
              </div>

              {/* Phase pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {PHASES.map((p) => {
                  const act = p.key === active.key;
                  return (
                    <span
                      key={p.key}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-1 text-xs transition ${
                        act
                          ? "border-white/40 bg-white/10"
                          : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                      }`}
                      title={`${p.label}: ${formatDate(new Date(p.start))} → ${formatDate(new Date(p.end))}`}
                    >
                      {p.label} <span className="text-white/60">{p.percent}%</span>
                      <span className="text-white/60">•</span>${p.priceUsd.toFixed(3)}
                    </span>
                  );
                })}
              </div>

              {/* Progress (no inline style) */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/70">Sold</span>
                  <span className="font-semibold">
                    {money(soldUSD)} <span className="text-white/60">/ {money(active.hardCapUsd)}</span>
                    <span className="text-white/60"> • {Math.floor(progressPct)}%</span>
                  </span>
                </div>

                <div className="h-3 rounded-full border border-white/10 bg-black/30 overflow-hidden">
                  {/* ✅ use scaleX instead of width style */}
                  <div
                    className="h-full origin-left rounded-full bg-gradient-to-r from-fuchsia-400/80 via-cyan-300/80 to-emerald-300/80 transition-transform duration-500"
                    style={{ transform: `scaleX(${progressPct / 100})` }}
                  />
                </div>

                <div className="mt-2 text-xs text-white/55">
                  Tip: Use <span className="font-mono">?sold=120000</span> to preview the progress bar.
                </div>
              </div>

              {/* Actions pinned near bottom for nicer alignment */}
              <div className="mt-auto pt-5 flex flex-wrap gap-3">
                <a
                  href={mode === "ended" ? "/tokenomics" : "#participate"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
                >
                  {mode === "live" ? "Participate Now" : mode === "pre" ? "Get Ready" : "View Tokenomics"}
                  <ArrowRight className="size-4" />
                </a>

                <a
                  href="/tokenomics"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  Tokenomics <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Right: Participate (full height) */}
          <div
            id="participate"
            className="h-full rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur shadow-[0_0_0_1px_rgba(255,255,255,0.04)] flex flex-col"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <WalletIcon className="size-5" />
                <h3 className="text-lg font-semibold">Participate (Solana)</h3>
              </div>

              {/* status only */}
              <div className="text-xs text-white/60">
                {publicKey ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-white/25" />
                    Not connected
                  </span>
                )}
              </div>
            </div>

            <p className="mt-1 text-sm text-white/70">
              Estimate your allocation and buy directly with your Solana wallet.
            </p>

            <div className="mt-4 space-y-3">
              <label className="text-sm text-white/70">Contribution (USD)</label>
              <input
                type="number"
                min={0}
                value={contribUSD}
                onChange={(e) => setContribUSD(Number(e.target.value || 0))}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 outline-none focus:ring-2 focus:ring-white/20"
                placeholder="1000"
              />

              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Estimated SLK</span>
                  <span className="font-semibold">{estTokensLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/70">Estimated SOL</span>
                  <span className="font-semibold">{solValue.toFixed(6)}</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-xs text-white/55">
                  Using demo rate: <span className="font-mono">$150 / SOL</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-xs text-white/60">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-400" />
                FCFS can enforce max allocation per wallet.
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-400" />
                Funds can be held until soft cap (if enabled).
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 text-emerald-400" />
                Price: ${active.priceUsd.toFixed(4)} / SLK
              </div>
            </div>

            <button
              disabled={mode !== "live" || !connected || connecting}
              onClick={onBuySolana}
              className={`mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                mode === "live" && connected && !connecting
                  ? "bg-white text-slate-900 hover:bg-white/90"
                  : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              <WalletIcon className="size-4" />
              {mode !== "live"
                ? "Not Live Yet"
                : !connected
                ? "Connect wallet to buy"
                : connecting
                ? "Connecting…"
                : "Buy (Solana)"}
            </button>

            {/* ✅ push disclaimer to bottom so heights align nicer */}
            <div className="mt-auto pt-4 text-[11px] text-white/45">
              By participating, you agree to the presale terms and understand token delivery depends on the final launch parameters.
            </div>
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="px-6 md:px-10 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">How to join</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              {
                icon: <WalletIcon className="size-5" />,
                title: "Prepare wallet",
                body: "Install Phantom / Solflare / Backpack and hold SOL for gas.",
              },
              {
                icon: <ShieldCheck className="size-5" />,
                title: "Verify details",
                body: "Confirm price, caps, and official treasury address before sending.",
              },
              {
                icon: <Coins className="size-5" />,
                title: "Contribute",
                body: "Enter amount, approve the transaction, and save your signature.",
              },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1 text-xs">
                  Step {i + 1}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  {s.icon}
                  <div className="font-medium">{s.title}</div>
                </div>
                <div className="mt-2 text-white/80 text-sm">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="px-6 md:px-10 pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-gradient-to-tr from-fuchsia-600/20 to-cyan-500/20 p-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-semibold">Ready to participate?</h3>
              <p className="text-white/80 mt-2">Read the whitepaper or explore tokenomics before contributing.</p>
            </div>
            <div className="flex gap-3 md:justify-end flex-wrap">
              <a
                href="/whitepaper"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
              >
                Whitepaper <ExternalLink className="size-4" />
              </a>
              <a
                href="/tokenomics"
                className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
              >
                Tokenomics <ArrowRight className="size-4" />
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

/* --- Small UI --- */
function TimeBox({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="text-3xl font-bold tabular-nums" suppressHydrationWarning>
        {value}
      </div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="rounded-xl bg-white/10 p-2">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-white truncate">{value}</div>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>
    </div>
  );
}
