// app/developers/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Developers — Solink",
  description: "Developer resources for building on Solink: API docs, status, changelog.",
  robots: { index: true, follow: true },
};

export default function DevelopersPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">Developers</h1>
      <p className="text-slate-400 mt-2">
        Build with Solink. Explore our APIs, check system status, and keep up with the latest changes.
      </p>

      <div className="grid gap-4 sm:grid-cols-3 mt-8">
        <Link href="/docs" className="rounded-xl border border-slate-800 p-4 hover:bg-slate-900/50">
          <div className="font-semibold">API Docs</div>
          <div className="text-slate-400 text-sm mt-1">REST/Webhook reference and examples.</div>
        </Link>
        <Link href="/status" className="rounded-xl border border-slate-800 p-4 hover:bg-slate-900/50">
          <div className="font-semibold">Status</div>
          <div className="text-slate-400 text-sm mt-1">Uptime and incident history.</div>
        </Link>
        <Link href="/changelog" className="rounded-xl border border-slate-800 p-4 hover:bg-slate-900/50">
          <div className="font-semibold">Changelog</div>
          <div className="text-slate-400 text-sm mt-1">What’s new in Solink.</div>
        </Link>
      </div>

      <div className="mt-8 text-sm text-slate-400">
        Need help? <Link href="/contact" className="text-sky-300 hover:underline">Contact us</Link>.
      </div>
    </section>
  );
}
