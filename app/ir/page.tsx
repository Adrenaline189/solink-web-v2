import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Investor Relations — Solink',
  description: 'Coming soon',
  robots: {
    index: false,
    follow: false,
  },
};

export default function IRPage() {
  return (
    <main className="min-h-[60vh] mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-4xl font-semibold tracking-tight">Investor Relations</h1>
      <p className="mt-4 text-slate-300">
        ข้อมูลกำลังจัดเตรียม — Coming soon
      </p>

      <section className="mt-12 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="text-sm text-slate-400">
          อัปเดตล่าสุด: 20 Aug 2025
        </div>
      </section>
    </main>
  );
}
