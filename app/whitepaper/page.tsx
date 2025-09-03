"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Download,
  ShieldCheck,
  Link2,
  LineChart,
  Blocks,
  Coins,
  Network,
  Users2,
  Rocket,
  Bug,
  Scale,
  FileText,
} from "lucide-react";

// ---------- Small UI helpers ----------
function Section({
  id,
  children,
  className = "",
}: React.PropsWithChildren<{ id: string; className?: string }>) {
  const ref = useRef<HTMLElement | null>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      id={id}
      ref={ref as any}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function H2({
  icon,
  children,
  id,
}: {
  icon?: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="group scroll-mt-28 text-2xl md:text-3xl font-semibold tracking-tight mb-4 flex items-center gap-3"
    >
      <span className="inline-flex items-center justify-center rounded-xl bg-white/10 p-2">
        {icon ?? <BookOpen className="size-5" />}
      </span>
      <span>{children}</span>
      <a
        href={`#${id}`}
        className="opacity-0 group-hover:opacity-100 transition ml-2 text-white/50"
        aria-label="Anchor link"
      >
        <Link2 className="size-4" />
      </a>
    </h2>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div className="text-xs text-white/70">{label}</div>
      <div className="text-lg">{value}</div>
    </div>
  );
}

// ---------- TOC (with scrollspy) ----------
const TOC = [
  { id: "abstract", label: "Abstract" },
  { id: "problem", label: "Problem & Opportunity" },
  { id: "solution", label: "Protocol Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "tokenomics", label: "Tokenomics Summary" },
  { id: "governance", label: "Governance" },
  { id: "economics", label: "Fees & Economic Model" },
  { id: "security", label: "Security & Compliance" },
  { id: "risk", label: "Risks & Mitigations" },
  { id: "roadmap", label: "Roadmap" },
  { id: "disclaimer", label: "Disclaimer" },
];

export default function WhitepaperPage() {
  const [active, setActive] = useState<string>(TOC[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // pick the section most visible in viewport
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );

    TOC.forEach((t) => {
      const el = document.getElementById(t.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const stats = useMemo(
    () => [
      { label: "Total Supply", value: "1,000,000,000 SLK" },
      { label: "Initial Circulation (TGE)", value: "≈12%" },
      { label: "Consensus", value: "Proof-of-Utility (application-layer)" },
      { label: "Governance", value: "DAO (Token-Weighted + Guardrails)" },
    ],
    []
  );

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-950 via-indigo-950 to-slate-950 text-white">
      {/* Glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Hero */}
      <section className="px-6 md:px-10 pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
                Solink Whitepaper
              </h1>
              <p className="mt-4 text-white/80 max-w-prose">
                A decentralized bandwidth-sharing network powering privacy-first
                connectivity and data access. This paper outlines the protocol
                design, token incentives, governance, and security posture.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href="/presale"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
                >
                  Join Presale <ArrowRight className="size-4" />
                </a>
                <a
                  href="/tokenomics"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  Tokenomics <ArrowRight className="size-4" />
                </a>
                <a
                  href="/whitepaper.pdf"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                >
                  <Download className="size-4" />
                  Download PDF
                </a>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              {stats.map((s) => (
                <Stat key={s.label} label={s.label} value={s.value} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-6 md:px-10 py-12">
        <div className="mx-auto max-w-6xl grid md:grid-cols-[260px,1fr] gap-8">
          {/* TOC */}
          <aside className="md:sticky md:top-24 h-fit rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-wider text-white/60 mb-3">
              Contents
            </div>
            <nav className="space-y-1">
              {TOC.map((t) => (
                <a
                  key={t.id}
                  href={`#${t.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition ${
                    active === t.id
                      ? "bg-white/10 text-white"
                      : "text-white/80 hover:bg-white/5"
                  }`}
                >
                  {t.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* Body */}
          <div className="space-y-14">
            <Section id="abstract">
              <H2 id="abstract" icon={<FileText className="size-5" />}>
                Abstract
              </H2>
              <p className="text-white/80">
                Solink is a decentralized bandwidth-sharing network that matches
                underutilized edge bandwidth with applications that need
                reliable, privacy-first connectivity. The protocol aligns
                participants through tokenized incentives, while governance and
                security guardrails ensure sustainable growth and credible
                neutrality.
              </p>
            </Section>

            <Section id="problem">
              <H2 id="problem" icon={<Bug className="size-5" />}>
                Problem & Opportunity
              </H2>
              <ul className="list-disc pl-5 space-y-2 text-white/80">
                <li>
                  Centralized bandwidth markets create single points of failure,
                  opaque pricing, and inconsistent coverage.
                </li>
                <li>
                  Users often have surplus capacity at the edge that remains
                  unmonetized.
                </li>
                <li>
                  Applications increasingly require compliant, privacy-preserving,
                  and geographically diverse connectivity.
                </li>
              </ul>
              <p className="text-white/80 mt-4">
                Solink unlocks a two-sided marketplace, rewarding supply for
                quality contributions and giving demand predictable performance
                with transparent economics.
              </p>
            </Section>

            <Section id="solution">
              <H2 id="solution" icon={<ShieldCheck className="size-5" />}>
                Protocol Overview
              </H2>
              <p className="text-white/80">
                The protocol coordinates three roles:
              </p>
              <ol className="list-decimal pl-5 text-white/80 space-y-2 mt-2">
                <li>
                  <strong>Suppliers</strong> share bandwidth via a lightweight
                  client and earn SLK proportional to quality-adjusted uptime,
                  coverage, and reliability.
                </li>
                <li>
                  <strong>Consumers</strong> pay for access using SLK or
                  supported stable assets; settlement is routed through the
                  protocol treasury.
                </li>
                <li>
                  <strong>Validators/Orchestrators</strong> score suppliers,
                  enforce policy, and facilitate routing with anti-fraud logic.
                </li>
              </ol>
            </Section>

            <Section id="architecture">
              <H2 id="architecture" icon={<Blocks className="size-5" />}>
                Architecture
              </H2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Network className="size-4" /> Data Plane
                  </h3>
                  <p className="text-white/80">
                    Encrypted tunnels between consumers and qualified suppliers.
                    Routing is policy-driven (region, capacity, compliance). No
                    PII is stored on-chain; only aggregate performance metrics
                    are committed for rewards.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <ShieldCheck className="size-4" /> Control Plane
                  </h3>
                  <p className="text-white/80">
                    Orchestrators maintain supplier registries, scoring,
                    staking/penalties, and enforce policy updates approved by
                    the DAO. All critical parameters are versioned and auditable.
                  </p>
                </div>
              </div>
            </Section>

            <Section id="tokenomics">
              <H2 id="tokenomics" icon={<Coins className="size-5" />}>
                Tokenomics Summary
              </H2>
              <ul className="list-disc pl-5 text-white/80 space-y-2">
                <li>
                  <strong>Total Supply:</strong> 1,000,000,000 SLK
                </li>
                <li>
                  <strong>Distribution:</strong> Private 15%, Public 10%, Team & Advisors 20%, Community & Ecosystem 30%, Treasury & Reserve 15%, Marketing & Partnerships 10%
                </li>
                <li>
                  <strong>Unlock Policies:</strong> Private (6m cliff → 12m linear), Public (100% at TGE), Marketing (20% at TGE → 12m linear), Team (12m cliff → 24m linear), Community (campaign-based to 36m), Treasury (DAO-controlled on demand)
                </li>
                <li>
                  <strong>Utility:</strong> payments, discounts, staking,
                  governance participation, and collateral for service-level
                  guarantees.
                </li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="/tokenomics"
                  className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
                >
                  Explore Tokenomics <ArrowRight className="size-4" />
                </a>
              </div>
            </Section>

            <Section id="governance">
              <H2 id="governance" icon={<Users2 className="size-5" />}>
                Governance
              </H2>
              <p className="text-white/80">
                Solink is governed by a DAO. Token-weighted proposals modify
                core parameters (emission ceilings, reward weights, risk policy),
                subject to safety guardrails:
              </p>
              <ul className="list-disc pl-5 text-white/80 space-y-2 mt-2">
                <li>Timelocks for sensitive changes</li>
                <li>Emergency pause with multi-sig and on-chain disclosure</li>
                <li>Conflict-of-interest and quorum thresholds</li>
              </ul>
            </Section>

            <Section id="economics">
              <H2 id="economics" icon={<LineChart className="size-5" />}>
                Fees & Economic Model
              </H2>
              <p className="text-white/80">
                Consumers pay per-usage fees; a protocol fee is routed to the
                Treasury. Rewards are distributed to suppliers based on
                performance-weighted contribution (uptime, latency, coverage).
                Emissions follow an adaptive decay with DAO-adjusted windows to
                avoid over-subsidization.
              </p>
            </Section>

            <Section id="security">
              <H2 id="security" icon={<ShieldCheck className="size-5" />}>
                Security & Compliance
              </H2>
              <ul className="list-disc pl-5 text-white/80 space-y-2">
                <li>End-to-end encryption and rotating keys</li>
                <li>No on-chain PII; differential privacy for metrics</li>
                <li>Independent audits for smart contracts and clients</li>
                <li>Abuse prevention: rate-limits, anomaly detection, slashing</li>
              </ul>
            </Section>

            <Section id="risk">
              <H2 id="risk" icon={<Scale className="size-5" />}>
                Risks & Mitigations
              </H2>
              <ul className="list-disc pl-5 text-white/80 space-y-2">
                <li>
                  <strong>Market Risk:</strong> phased emissions, utility-based
                  sinks, and Treasury stabilization tools.
                </li>
                <li>
                  <strong>Operational Risk:</strong> multi-client diversity,
                  observability, circuit breakers.
                </li>
                <li>
                  <strong>Regulatory Risk:</strong> geofencing policy layer,
                  compliance-by-design, DAO transparency reports.
                </li>
              </ul>
            </Section>

            <Section id="roadmap">
              <H2 id="roadmap" icon={<Rocket className="size-5" />}>
                Roadmap
              </H2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium">Phase 1 — Launch</h3>
                  <ul className="list-disc pl-5 text-white/80 space-y-1 mt-2">
                    <li>Core network + client beta</li>
                    <li>Incentivized test campaigns</li>
                    <li>DAO bootstrapping</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium">Phase 2 — Scale</h3>
                  <ul className="list-disc pl-5 text-white/80 space-y-1 mt-2">
                    <li>Coverage expansion</li>
                    <li>QoS scoring v2, staking</li>
                    <li>Partner integrations</li>
                  </ul>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <h3 className="font-medium">Phase 3 — Maturity</h3>
                  <ul className="list-disc pl-5 text-white/80 space-y-1 mt-2">
                    <li>Advanced marketplace features</li>
                    <li>Cross-domain bandwidth products</li>
                    <li>Progressive decentralization</li>
                  </ul>
                </div>
              </div>
            </Section>

            <Section id="disclaimer">
              <H2 id="disclaimer" icon={<Scale className="size-5" />}>
                Disclaimer
              </H2>
              <p className="text-white/80">
                This document is for informational purposes only and does not
                constitute financial, legal, or investment advice. Token
                allocations, schedules, and specifications may evolve through
                DAO governance. Always conduct your own research and consider
                applicable regulations in your jurisdiction.
              </p>
            </Section>

            {/* Footer CTA */}
            <div className="pt-4">
              <div className="rounded-3xl border border-white/10 bg-gradient-to-tr from-fuchsia-600/20 to-cyan-500/20 p-6">
                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold">
                      Ready to participate?
                    </h3>
                    <p className="text-white/80 mt-2">
                      Join the presale, review tokenomics, or follow the roadmap
                      to get involved.
                    </p>
                  </div>
                  <div className="flex gap-3 md:justify-end">
                    <a
                      href="/presale"
                      className="inline-flex items-center gap-2 rounded-2xl bg-white text-slate-900 px-5 py-3 text-sm font-semibold hover:bg-white/90 transition"
                    >
                      Join Presale <ArrowRight className="size-4" />
                    </a>
                    <a
                      href="/tokenomics"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                    >
                      Tokenomics <ArrowRight className="size-4" />
                    </a>
                    <a
                      href="/whitepaper.pdf"
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold hover:bg-white/10 transition"
                    >
                      <Download className="size-4" />
                      Download PDF
                    </a>
                  </div>
                </div>
              </div>
            </div>
            {/* /Footer CTA */}
          </div>
        </div>
      </section>

      <footer className="px-6 md:px-10 pb-12 text-center text-white/50 text-sm">
        © {new Date().getFullYear()} Solink Network
      </footer>
    </main>
  );
}
