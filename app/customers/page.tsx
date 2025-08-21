import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Customers — Solink",
  description: "Customer stories and references.",
  robots: { index: false, follow: false },
};

const LOGOS = Array.from({ length: 12 }).map((_, i) => `Logo ${i + 1}`);

export default function CustomersPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Customers</h1>
        <p className="mt-4 max-w-2xl text-slate-300">Trusted by teams building for performance, scale, and compliance.</p>
      </header>

      <section className="mt-12">
        <SectionTitle title="Logo wall" subtitle="Replace placeholders with real brands when available." />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {LOGOS.map((name) => (
            <div
              key={name}
              className="flex h-20 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900/40 text-slate-400"
            >
              {name}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionTitle title="Testimonials" subtitle="Short quotes that highlight outcomes, not just features." />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { quote: "Cut infra cost while keeping latency predictable.", by: "VP Engineering, SaaS" },
            { quote: "Easy to integrate and observe across regions.", by: "Head of Platform" },
            { quote: "Rewarding model with guardrails we can trust.", by: "GM, Data Products" },
          ].map((t) => (
            <figure key={t.by} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <blockquote className="text-slate-200">“{t.quote}”</blockquote>
              <figcaption className="mt-2 text-xs text-slate-400">— {t.by}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
