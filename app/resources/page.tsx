import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Resources — Solink",
  description: "Docs, guides, and downloads.",
  robots: { index: false, follow: false },
};

const RESOURCES = [
  { type: "Docs", title: "Getting Started", href: "#" },
  { type: "Guide", title: "Routing Policies 101", href: "#" },
  { type: "Guide", title: "Observability & Alerts", href: "#" },
  { type: "SDK", title: "Node.js Client", href: "#" },
  { type: "Whitepaper", title: "Incentive Model Overview", href: "#" },
  { type: "Checklist", title: "Security Review Prep", href: "#" },
];

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Resources</h1>
        <p className="mt-4 max-w-2xl text-slate-300">Documentation, guides, SDKs, and whitepapers—centralized in one place.</p>
      </header>

      <section className="mt-12">
        <SectionTitle title="Library" />
        <div className="grid gap-4 md:grid-cols-3">
          {RESOURCES.map((r) => (
            <a
              key={r.title}
              href={r.href}
              className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/60"
            >
              <div className="text-xs uppercase tracking-wider text-slate-400">{r.type}</div>
              <div className="mt-1 text-lg font-medium text-white">{r.title}</div>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
