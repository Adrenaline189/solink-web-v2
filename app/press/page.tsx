import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press — Solink",
  description: "Press resources and media kit.",
  robots: { index: false, follow: false },
};

const UPDATED = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default function PressPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Press</h1>
      <p className="mt-4 text-slate-300">Coming soon — press releases, media kit, and brand assets.</p>
      <div className="mt-8 text-xs text-slate-400">Last updated: {UPDATED}</div>
    </main>
  );
}
