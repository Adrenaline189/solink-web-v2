// app/[locale]/ir/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investor Relations — Solink",
  description: "Highlights, deck, milestones, and investor FAQ.",
  robots: { index: false, follow: false }, // keep noindex until ready
};

const UPDATED = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function IRPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="text-4xl font-semibold tracking-tight">Investor Relations</h1>
      <p className="mt-3 text-slate-300">
        A concise hub for investors: current highlights, downloadable materials, key milestones, and FAQs.
      </p>
      <div className="mt-2 text-xs text-slate-400">Last updated: {UPDATED}</div>

      {/* Highlights */}
      <section className="mt-12">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-slate-400">Highlights</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Key metrics (sample data)</h2>
          <p className="mt-2 text-slate-300">Replace these with live or periodically updated figures and specify the time range clearly.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-400">Monthly Active Users</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-white">12,400+</div>
            <div className="mt-2 text-xs text-slate-400">Trailing 30 days</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-400">MRR</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-white">$28,600</div>
            <div className="mt-2 text-xs text-slate-400">+18% MoM</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-400">NRR</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-white">122%</div>
            <div className="mt-2 text-xs text-slate-400">6–12 month cohorts</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
            <div className="text-sm text-slate-400">Gross Margin</div>
            <div className="mt-2 text-3xl font-bold tracking-tight text-white">78%</div>
            <div className="mt-2 text-xs text-slate-400">Current quarter</div>
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="mt-16">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-slate-400">Materials</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Deck & One-pager</h2>
          <p className="mt-2 text-slate-300">Place files in <code className="text-slate-200">public/ir/</code> to keep links stable.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <a href="/ir/solink-deck.pdf" className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/60" target="_blank" rel="noopener">
            <div className="text-sm text-slate-400">Pitch Deck (PDF)</div>
            <div className="mt-1 text-lg font-medium text-white">Download Deck</div>
            <div className="mt-2 text-xs text-slate-400"><code>public/ir/solink-deck.pdf</code></div>
          </a>
          <a href="/ir/solink-onepager.pdf" className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/60" target="_blank" rel="noopener">
            <div className="text-sm text-slate-400">One-pager (PDF)</div>
            <div className="mt-1 text-lg font-medium text-white">Download One-pager</div>
            <div className="mt-2 text-xs text-slate-400"><code>public/ir/solink-onepager.pdf</code></div>
          </a>
        </div>
      </section>

      {/* Milestones */}
      <section className="mt-16">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-slate-400">Timeline</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Milestones</h2>
          <p className="mt-2 text-slate-300">A snapshot of progress that signals momentum and de-risking.</p>
        </div>
        <ul className="space-y-3">
          <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-sm text-slate-400">Q1/2025</div>
            <div className="text-white">Beta launch with first 5 design partners</div>
          </li>
          <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-sm text-slate-400">Q2/2025</div>
            <div className="text-white">First enterprise customer signed (ARR $xx,xxx)</div>
          </li>
          <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-sm text-slate-400">Q3/2025</div>
            <div className="text-white">Launched ___ feature & completed internal security review</div>
          </li>
        </ul>
      </section>

      {/* FAQ */}
      <section className="mt-16">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-slate-400">FAQ</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Frequently Asked Questions</h2>
        </div>
        <div className="space-y-3">
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <summary className="cursor-pointer list-none text-white">What is your revenue model?</summary>
            <div className="mt-2 text-slate-300">Example: monthly subscription plus usage-based fees for advanced modules.</div>
          </details>
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <summary className="cursor-pointer list-none text-white">How will you use the proceeds from this round?</summary>
            <div className="mt-2 text-slate-300">Example: expand sales/support, accelerate 12–18 month roadmap, and complete security certifications.</div>
          </details>
          <details className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <summary className="cursor-pointer list-none text-white">Key risks and mitigations?</summary>
            <div className="mt-2 text-slate-300">Example: platform dependency, churn in segment X, PDPA/GDPR compliance—include concrete mitigation steps.</div>
          </details>
        </div>
      </section>

      {/* Contact */}
      <section className="mt-16">
        <div className="mb-8">
          <div className="text-xs uppercase tracking-wider text-slate-400">Contact</div>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Investor Relations Contact</h2>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <div className="text-slate-300">
            Email: <a href="mailto:ir@yourdomain.com" className="text-cyan-400 hover:underline">ir@yourdomain.com</a>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Note: This page is <strong>no-index</strong> for now. Remove the robots restriction when ready.
          </div>
        </div>
      </section>
    </main>
  );
}
