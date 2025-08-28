// app/ir/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "../../components/ui/card";
import { FileText, Newspaper, BarChart3, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Investor Relations — Solink",
  description: "Company overview, token economics, and key disclosures for investors."
};

export default function IRPage() {
  return (
    <main className="p-6 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold">Investor Relations</h1>
          <p className="text-slate-400">
            Key materials for investors and partners. For additional info, contact{" "}
            <a href="mailto:ir@solink.network" className="text-sky-300 hover:underline">
              ir@solink.network
            </a>.
          </p>
          <div className="flex gap-3">
            <Link
              href="/ir/news"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2 bg-slate-100 text-slate-900 hover:bg-white/90"
            >
              Latest news <Newspaper className="ml-1 h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-2 border border-slate-700 bg-slate-900/40 text-slate-100 hover:bg-slate-800"
            >
              Contact IR
            </Link>
          </div>
        </header>

        {/* Highlights */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-cyan-300" />
                <h3 className="text-lg font-semibold">Network growth</h3>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Expanding node presence across regions for resiliency and lower latency.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-emerald-300" />
                <h3 className="text-lg font-semibold">Security-first</h3>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Privacy-preserving architecture and rigorous review process.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-300" />
                <h3 className="text-lg font-semibold">Transparent metrics</h3>
              </div>
              <p className="mt-2 text-sm text-slate-400">
                Quarterly reports with usage, rewards and treasury updates.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Key Documents */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Key documents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-slate-800 bg-slate-900/40">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold">Whitepaper</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Architecture, incentives, and protocol design.
                </p>
                <div className="mt-3">
                  <a
                    href="/docs/solink-whitepaper.pdf"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </a>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900/40">
              <CardContent className="p-5">
                <h3 className="text-lg font-semibold">Token economics</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Distribution, emissions, and utility of SLK.
                </p>
                <div className="mt-3">
                  <a
                    href="/docs/solink-token-economics.pdf"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800"
                  >
                    <FileText className="h-4 w-4" />
                    Download PDF
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-slate-500">
            * Replace the links with real files in <code>/public/docs</code>.
          </p>
        </section>

        {/* Governance / Notes */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Governance & disclosures</h2>
          <ul className="list-disc pl-5 text-sm text-slate-300 space-y-1">
            <li>Quarterly updates posted on the IR News page.</li>
            <li>Bug bounty program and security reports are published regularly.</li>
            <li>Community proposals posted in the public forum.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
