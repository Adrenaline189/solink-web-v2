import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Company — Solink', description: 'Coming soon', robots: { index:false, follow:false } };
export default function Page(){ return (
  <main className="min-h-[60vh] mx-auto max-w-5xl px-6 py-16"><h1 className="text-4xl font-semibold">Company</h1><p className="mt-4 text-slate-300">Coming soon</p><div className="mt-12 text-sm text-slate-400">อัปเดตล่าสุด: {new Date().toLocaleDateString('th-TH')}</div></main>
);}