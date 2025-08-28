// app/company/page.tsx
import type { Metadata } from "next";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Company — Solink",
  description: "Learn more about Solink.",
  robots: { index: true, follow: true },
};

export default function CompanyPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <h1 className="text-4xl font-extrabold mb-2">About Solink</h1>
      <p className="text-slate-400 mb-8">
        We are building an open bandwidth marketplace that rewards contributors fairly.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-800 p-6 bg-slate-900/40">
          <div className="font-semibold mb-2">Our mission</div>
          <p className="text-slate-300 text-sm">
            Make bandwidth sharing simple, private, and sustainable.
            We align incentives with quality and trust.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 p-6 bg-slate-900/40">
          <div className="font-semibold mb-2">What we value</div>
          <ul className="text-slate-300 text-sm space-y-2">
            <li>• Privacy by default</li>
            <li>• Transparent economics</li>
            <li>• Community-driven growth</li>
          </ul>
        </div>
      </div>

      <Footer />
    </div>
  );
}
