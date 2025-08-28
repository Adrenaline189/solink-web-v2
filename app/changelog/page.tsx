// app/changelog/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Changelog — Solink",
  description: "Latest updates, fixes and improvements to Solink.",
  robots: { index: true, follow: true },
};

export default function ChangelogPage() {
  const logs = [
    { date: "2025-08-20", title: "Dashboard refresh", body: "New charts, status widgets, and referral panel." },
    { date: "2025-08-15", title: "Settings", body: "Theme, time zone, and currency preferences." },
    { date: "2025-08-10", title: "API (alpha)", body: "Summary, hourly points and transactions endpoints." },
  ];

  return (
    <section className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="text-3xl font-bold">Changelog</h1>
      <p className="text-slate-400 mt-2">What’s new in Solink.</p>

      <div className="mt-8 space-y-6">
        {logs.map((l, i) => (
          <div key={i} className="rounded-xl border border-slate-800 p-5">
            <div className="text-xs text-slate-500">{l.date}</div>
            <div className="text-lg font-semibold mt-1">{l.title}</div>
            <div className="text-slate-300 mt-1">{l.body}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
