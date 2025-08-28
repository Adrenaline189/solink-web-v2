// app/terms/page.tsx
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Terms — Solink",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-slate-400 mt-4">
        These Terms govern your use of Solink services. (Draft placeholder — replace with legal text.)
      </p>
      <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-300">
        <li>Acceptable use and restrictions</li>
        <li>Account & data handling</li>
        <li>Liability & warranty disclaimer</li>
        <li>Governing law & disputes</li>
      </ul>
      <p className="text-slate-500 text-sm mt-6">Last updated: {new Date().toISOString().slice(0,10)}</p>
    </main>
  );
}
