// app/status/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Status — Solink",
  description: "Current status and uptime information for Solink services.",
  robots: { index: true, follow: true },
};

export default function StatusPage() {
  // Placeholder (ใส่จริงเชื่อม status provider ภายหลัง)
  const items = [
    { name: "API", status: "Operational" },
    { name: "Dashboard", status: "Operational" },
    { name: "Webhooks", status: "Operational" },
  ];

  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Status</h1>
      <p className="text-slate-400 mt-2">All systems operational.</p>

      <div className="mt-6 grid gap-3">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between rounded-xl border border-slate-800 px-4 py-3">
            <div className="text-slate-300">{it.name}</div>
            <div className="text-emerald-400 text-sm">{it.status}</div>
          </div>
        ))}
      </div>

      <div className="text-sm text-slate-500 mt-6">
        Last updated: {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
      </div>
    </section>
  );
}
