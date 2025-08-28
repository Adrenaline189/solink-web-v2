// app/privacy/page.tsx
import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Privacy — Solink",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-slate-400 mt-4">
        How we collect, use, and protect your data. (Draft placeholder — replace with legal text.)
      </p>
      <ul className="list-disc pl-5 mt-4 space-y-2 text-slate-300">
        <li>Data we collect & purpose</li>
        <li>Cookies & local storage</li>
        <li>Third-party processors (e.g., email, analytics)</li>
        <li>Your rights & contact</li>
      </ul>
      <p className="text-slate-500 text-sm mt-6">Last updated: {new Date().toISOString().slice(0,10)}</p>
    </main>
  );
}
