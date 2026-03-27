import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Roadmap | Solink",
  description: "Public development roadmap for Solink — decentralized bandwidth-sharing on Solana.",
};

const PHASES = [
  {
    phase: "Phase 1",
    name: "Foundation",
    period: "Mar – Jun 2026",
    status: "current" as const,
    color: "cyan",
    items: [
      "Website & branding launch",
      "Dashboard beta (points, rewards, sharing)",
      "Database schema & API infrastructure",
      "Presale page & tokenomics design",
      "Whitepaper v1.0",
      "Community building",
    ],
  },
  {
    phase: "Phase 2",
    name: "Testnet & Presale",
    period: "Jul – Oct 2026",
    status: "upcoming" as const,
    color: "fuchsia",
    items: [
      "Presale: Seed → Private → Public (3 rounds)",
      "SPL Token creation & distribution",
      "Solana presale smart contract (Anchor)",
      "Browser extension beta",
      "Testnet node registration",
      "DAO governance framework",
    ],
  },
  {
    phase: "Phase 3",
    name: "Mainnet Launch",
    period: "Oct – Dec 2026",
    status: "upcoming" as const,
    color: "emerald",
    items: [
      "TGE — Token Generation Event",
      "Mainnet node onboarding",
      "Bandwidth marketplace live",
      "Squads Protocol multisig treasury",
      "Community rewards program",
      "First partner integrations",
    ],
  },
  {
    phase: "Phase 4",
    name: "Scale & Maturity",
    period: "2027+",
    status: "planned" as const,
    color: "amber",
    items: [
      "Mobile client (iOS & Android)",
      "Cross-DePIN integrations",
      "Reputation & slashing system",
      "Advanced governance (on-chain voting)",
      "Decentralized orchestrator network",
      "Enterprise bandwidth products",
    ],
  },
];

const STATUS_CONFIG = {
  current: {
    label: "In Progress",
    icon: <Circle className="size-4 fill-cyan-400 text-cyan-400" />,
    badge: "bg-cyan-900/40 border-cyan-700/50 text-cyan-300",
  },
  upcoming: {
    label: "Upcoming",
    icon: <Clock className="size-4 text-slate-400" />,
    badge: "bg-slate-800/60 border-slate-700/50 text-slate-300",
  },
  planned: {
    label: "Planned",
    icon: <Clock className="size-4 text-amber-500" />,
    badge: "bg-amber-900/30 border-amber-700/50 text-amber-300",
  },
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="size-4 text-emerald-400" />,
    badge: "bg-emerald-900/40 border-emerald-700/50 text-emerald-300",
  },
};

const COLOR_MAP: Record<string, string> = {
  cyan: "border-cyan-800/60",
  fuchsia: "border-fuchsia-800/60",
  emerald: "border-emerald-800/60",
  amber: "border-amber-800/60",
};

export default function RoadmapPage() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-20">
      {/* Header */}
      <Reveal>
        <header className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold">
            Roadmap
          </h1>
          <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
            How Solink grows from foundation to a fully decentralized bandwidth network.
          </p>
        </header>
      </Reveal>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-cyan-800 via-slate-700 to-slate-800" />

        <div className="space-y-12">
          {PHASES.map((p, i) => {
            const sc = STATUS_CONFIG[p.status];
            return (
              <Reveal key={p.phase} delay={0.1 * i}>
                <div className="relative pl-20">
                  {/* Dot */}
                  <div className={`absolute left-5.5 -translate-x-1/2 w-5 h-5 rounded-full border-2 ${
                    p.status === "current"
                      ? "bg-cyan-950 border-cyan-400"
                      : p.status === "upcoming"
                      ? "bg-slate-950 border-slate-600"
                      : "bg-slate-950 border-amber-700"
                  }`} />

                  {/* Card */}
                  <div
                    className={`rounded-2xl border ${COLOR_MAP[p.color]} bg-slate-950/40 p-6`}
                  >
                    {/* Phase header */}
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
                      <div>
                        <div className="text-xs font-medium text-slate-500 mb-0.5">{p.phase}</div>
                        <h2 className="text-xl font-bold">{p.name}</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${sc.badge}`}>
                          {sc.icon}
                          {sc.label}
                        </span>
                        <span className="text-xs text-slate-500">{p.period}</span>
                      </div>
                    </div>

                    {/* Items */}
                    <ul className="space-y-2">
                      {p.items.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-sm text-slate-300">
                          <CheckCircle2 className="size-4 text-cyan-400 mt-0.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <Reveal>
        <div className="mt-16 rounded-3xl border border-slate-800 bg-gradient-to-br from-cyan-950/20 to-fuchsia-950/20 p-8 text-center">
          <h2 className="text-2xl font-bold">Want to build on Solink?</h2>
          <p className="mt-2 text-slate-400 max-w-md mx-auto">
            Join the network as a node operator, partner, or contributor. The bandwidth economy starts here.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <a
              href="/presale"
              className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-6 py-3 font-semibold hover:bg-white/90 transition"
            >
              Join Presale
            </a>
            <a
              href="/whitepaper"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800/60 transition"
            >
              Read Whitepaper
            </a>
          </div>
        </div>
      </Reveal>

      <Footer />
    </div>
  );
}
