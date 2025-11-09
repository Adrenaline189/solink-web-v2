"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight, CalendarDays, Clock, Coins, Flame, ShieldCheck,
  Wallet as WalletIcon, CheckCircle2, ExternalLink
} from "lucide-react";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  SystemProgram, Transaction, LAMPORTS_PER_SOL, PublicKey
} from "@solana/web3.js";

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
  percent: number; // เพิ่มฟิลด์ % ตามที่ต้องการ
};

// Auto pick next year (Bangkok +07:00).
const YEAR = new Date().getFullYear() + 1;
const TZ = "+07:00";

/*
  Schedule (ทุกช่วงเริ่ม 19:00 น.):
  - Seed:    Jan 1 → Jan 3
  - Private: Jan 3 → Jan 5
  - Public:  Jan 5 → Jan 7
  * สามารถ override เริ่มต้นด้วย NEXT_PUBLIC_PRESALE_START ได้ตามเดิม
*/

const PHASES: Phase[] = [
  {
    key: "seed",
    label: "Seed",
    start: process.env.NEXT_PUBLIC_PRESALE_START ?? `${YEAR}-01-01T19:00:00${TZ}`,
    end: `${YEAR}-01-03T19:00:00${TZ}`,
    priceUsd: 0.005,
    hardCapUsd: 250_000,
    softCapUsd: 100_000,
    percent: 5,
  },
  {
    key: "private",
    label: "Private",
    start: `${YEAR}-01-03T19:00:00${TZ}`,
    end: `${YEAR}-01-05T19:00:00${TZ}`,
    priceUsd: 0.010,
    hardCapUsd: 500_000,
    softCapUsd: 200_000,
    percent: 10,
  },
  {
    key: "public",
    label: "Public",
    start: `${YEAR}-01-05T19:00:00${TZ}`,
    end: `${YEAR}-01-07T19:00:00${TZ}`,
    priceUsd: 0.020,
    hardCapUsd: 1_000_000,
    softCapUsd: 300_000,
    percent: 10,
  },
];

const SOL_TREASURY =
  process.env.NEXT_PUBLIC_SOLANA_TREASURY || "11111111111111111111111111111111";

/* Hydration-safe date format */
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
  calendar: "gregory",
  numberingSystem: "latn",
});

/* ---------- Helpers ---------- */
function pad(n: number) { return n.toString().padStart(2, "0"); }
function formatDate(d: Date) { return dateFmt.format(d); }

function Section({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
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
  const phases = PHASES.map(p => ({
    ...p,
    startMs: new Date(p.start).getTime(),
    endMs: new Date(p.end).getTime(),
  }));
  if (nowMs == null) return phases.find(p => Date.now() < p.startMs) || phases[0];
  return (
    phases.find(p => nowMs >= p.startMs && nowMs < p.endMs) ||
    phases.find(p => nowMs < p.startMs) ||
    phases[phases.length - 1]
  );
}

function countdown(targetMs: number, nowMs: number | null) {
  if (nowMs == null) return { days: "--", hours: "--", minutes: "--", seconds: "--", total: null as null | number };
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
  const start = new Date(active.start);
  const end = new Date(active.end);

  const mode =
    nowMs == null ? "pre" :
    nowMs < start.getTime() ? "pre" :
    nowMs < end.getTime() ? "live" : "ended";

  const target = mode === "pre" ? start.getTime() : end.getTime();
  const c = countdown(target, nowMs);

  // demo progress (?sold=)
  const [soldUSD, setSoldUSD] = useState<number>(250_000);
  useEffect(() => {
    const s = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("sold") : null;
    if (s && !Number.isNaN(Number(s))) setSoldUSD(Number(s));
  }, []);
  const progressPct = Math.min(100, (soldUSD / active.hardCapUsd) * 100);

  const [contribUSD, setContribUSD] = useState<number>(1000);
  const tokensPerUSD = 1 / active.priceUsd;
  const estTokens = Math.floor(contribUSD * tokensPerUSD);
  const estTokensLabel = estTokens.toLocaleString("en-US");

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
    mode === "pre" ? `${active.label} starts in`
    : mode === "live" ? `${active.label} ends in`
    : `${active.label} ended`;

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Header */}
      <div className="px-6 md:px-10 pt-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between gap-4">
          <h1 className="text-lg font-semibold">Solink Presale — Solana</h1>
          <SolanaConnectButton />
        </div>
      </div>

      {/* Hero */}
      <Section className="px-6 md:px-10 pt-6">
        <div className="mx-auto max-w-6xl grid lg:grid-cols-[1.2fr,0.8fr] gap-10 items-start">
          {/* left: countdown & stats */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80">
              <Flame className="size-4 text-fuchsia-400" /> Solana presale (SPL)
            </div>
            <h2 className="mt-3 text-4xl md:text-5xl font-bold tracking-tight">{active.label} Round</h2>
            <p className="mt-3 text-white/80 max-w-prose">
              Join the decentralized bandwidth revolution on Solana. Fast, secure, and low fees.
            </p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center gap-2 text-white/70">
                <Clock className="size-5" />
                <span className="text-sm">{phaseLabel}</span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3 text-center">
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

              {/* phases */}
              <div className="mt-5 flex flex-wrap gap-2">
                {PHASES.map(p => {
                  const act = p.key === active.key;
                  return (
                    <span
                      key={p.key}
                      className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1 text-xs ${act ? "border-white/50 bg-white/10" : "border-white/10 bg-white/5 text-white/70"}`}
                      title={`${p.label}: ${formatDate(new Date(p.start))} → ${formatDate(new Date(p.end))}`}
                    >
                      {p.label} {p.percent}% (${p.priceUsd})
                    </span>
                  );
                })}
              </div>

              {/* progress (no inline styles) */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-white/70">Sold</span>
                  <span className="font-semibold">
                    ${soldUSD.toLocaleString("en-US")} ({Math.floor(progressPct)}%)
                  </span>
                </div>

                <meter
                  min={0}
                  max={active.hardCapUsd}
                  value={soldUSD}
                  className="slk-meter"
                  aria-label="Presale progress"
                />
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={mode === "ended" ? "/tokenomics" : "#participate"}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
                >
                  {mode === "live" ? "Participate Now" : mode === "pre" ? "Get Whitelisted" : "View Tokenomics"}
                  <ArrowRight className="size-4" />
                </a>
                <a
                  href="/whitepaper"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  Read Whitepaper <ExternalLink className="size-4" />
                </a>
              </div>
            </div>
          </div>

          {/* right: participate (Solana only) */}
          <div id="participate" className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <WalletIcon className="size-5" />
                <h3 className="text-lg font-semibold">Participate (Solana)</h3>
              </div>
              <SolanaConnectButton variant="ghost" />
            </div>
            <p className="mt-1 text-sm text-white/70">Estimate your allocation and buy directly with your Solana wallet.</p>

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
              <div className="rounded-xl bg-black/30 p-3 text-sm grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between">
                  <span>Estimated SLK</span>
                  <span className="font-semibold">{estTokensLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Estimated SOL</span>
                  <span className="font-semibold">{solValue.toFixed(6)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-2 text-xs text-white/60">
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> FCFS will enable max allocation per wallet.</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Funds held in escrow until soft cap (if applicable).</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="size-4 text-emerald-400" /> Price: ${active.priceUsd.toFixed(4)} / SLK</div>
            </div>

            <button
              disabled={mode !== "live" || !connected || connecting}
              onClick={onBuySolana}
              className={`mt-5 w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition ${
                mode === "live" ? "bg-white text-slate-900 hover:bg-white/90" : "bg-white/10 text-white/50 cursor-not-allowed"
              }`}
            >
              <WalletIcon className="size-4" /> {mode !== "live" ? "Not Live Yet" : "Buy (Solana)"}
            </button>

            {/* 🔒 Treasury hidden on UI — still used under the hood */}
          </div>
        </div>
      </Section>

      {/* How it works */}
      <Section className="px-6 md:px-10 py-14">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold">How to join</h2>
          <div className="mt-6 grid md:grid-cols-3 gap-4">
            {[
              { icon: <WalletIcon className="size-5" />, title: "Prepare wallet", body: "Install Phantom / Solflare / Backpack and hold SOL for gas." },
              { icon: <ShieldCheck className="size-5" />, title: "Verify details", body: "Confirm price, vesting, and the official program addresses." },
              { icon: <Coins className="size-5" />, title: "Contribute", body: "Enter amount, confirm transaction, and track your signature." },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1 text-xs">Step {i + 1}</div>
                <div className="mt-3 flex items-center gap-2">{s.icon}<div className="font-medium">{s.title}</div></div>
                <div className="mt-2 text-white/80 text-sm">{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section className="px-6 md:px-10 pb-24">
        <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-gradient-to-tr from-fuchsia-600/20 to-cyan-500/20 p-8">
          <div className="grid md:grid-cols-2 gap-6 items-center">
            <div>
              <h3 className="text-2xl font-semibold">Ready to participate?</h3>
              <p className="text-white/80 mt-2">Read the whitepaper or explore tokenomics before contributing.</p>
            </div>
            <div className="flex gap-3 md:justify-end">
              <a href="/whitepaper" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition">Whitepaper <ExternalLink className="size-4" /></a>
              <a href="/tokenomics" className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition">Tokenomics <ArrowRight className="size-4" /></a>
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
    <div className="rounded-2xl bg-black/30 p-4">
      <div className="text-3xl font-bold tabular-nums" suppressHydrationWarning>{value}</div>
      <div className="text-xs text-white/60">{label}</div>
    </div>
  );
}
function StatCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
      <div className="rounded-xl bg-white/10 p-2">{icon}</div>
      <div>
        <div className="text-xs text-white/70">{label}</div>
        <div className="text-white">{value}</div>
        {hint ? <div className="text-xs text-white/50">{hint}</div> : null}
      </div>
    </div>
  );
}
