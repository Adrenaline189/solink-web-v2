import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Solutions — Solink",
  description: "Use cases and industry solutions.",
  robots: { index: false, follow: false },
};

const UPDATED = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const SOLUTIONS = [
  {
    name: "Consumer Apps",
    problem: "Unpredictable traffic spikes and costly over-provisioning.",
    solution: "Burst capacity via distributed peers with policy-guardrails and analytics.",
    outcome: "Lower infra cost while keeping latency under control.",
  },
  {
    name: "Enterprise SaaS",
    problem: "Regional compliance and data-residency constraints.",
    solution: "Region pinning, allow/deny lists, and tamper-evident logs.",
    outcome: "Meet requirements without adding operational drag.",
  },
  {
    name: "Web3 / Data",
    problem: "Throughput volatility and reward fraud.",
    solution: "Rate-limiting, signature checks, and anomaly detection.",
    outcome: "Predictable throughput; fair, auditable rewards.",
  },
];

export default function SolutionsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Solutions</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          From high-growth apps to regulated industries—configure policies, routes, and rewards to fit your stack.
        </p>
        <div className="mt-3 text-xs text-slate-400">Last updated: {UPDATED}</div>
      </header>

      <section className="mt-12">
        <SectionTitle title="Use cases" subtitle="Problem → Solution → Outcome, per segment." />
        <div className="grid gap-4 md:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <div key={s.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h3 className="text-lg font-medium text-white">{s.name}</h3>
              <div className="mt-3 text-sm">
                <div className="text-slate-400">Problem</div>
                <p className="text-slate-300">{s.problem}</p>
              </div>
              <div className="mt-3 text-sm">
                <div className="text-slate-400">Solution</div>
                <p className="text-slate-300">{s.solution}</p>
              </div>
              <div className="mt-3 text-sm">
                <div className="text-slate-400">Outcome</div>
                <p className="text-slate-300">{s.outcome}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
