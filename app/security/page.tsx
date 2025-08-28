import type { Metadata } from 'next';
import SectionTitle from '@/components/SectionTitle';
import { Shield, Lock, FileCheck2, Eye } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Security & Compliance — Solink',
  description: 'Security, privacy, and compliance posture.',
  robots: { index: false, follow: false },
};

const ITEMS = [
  {
    icon: <Lock className="h-5 w-5" />,
    title: 'Encryption',
    desc: 'TLS 1.2+ in transit; envelope encryption at rest.',
  },
  {
    icon: <FileCheck2 className="h-5 w-5" />,
    title: 'Access Control',
    desc: 'Least-privilege, SSO/SAML (enterprise), audit trails.',
  },
  {
    icon: <Eye className="h-5 w-5" />,
    title: 'Observability',
    desc: 'Tamper-evident logs, retention policies, alerting.',
  },
  {
    icon: <Shield className="h-5 w-5" />,
    title: 'Compliance',
    desc: 'GDPR/PDPA aligned data handling; DPA available.',
  },
];

export default function SecurityPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Security & Compliance</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          Our security model prioritizes isolation, visibility, and control.
        </p>
      </header>

      <section className="mt-12">
        <SectionTitle title="Posture" />
        <div className="grid gap-4 md:grid-cols-2">
          {ITEMS.map((it) => (
            <div key={it.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/70 px-2 py-1 text-xs">
                {it.icon}
                <span>{it.title}</span>
              </div>
              <p className="mt-3 text-slate-300">{it.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <SectionTitle
          title="Documents"
          subtitle="Security overview and Data Processing Addendum available on request."
        />
        <div className="grid gap-4 md:grid-cols-2">
          <a
            href="#"
            className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/60"
          >
            <div className="text-sm text-slate-400">Overview (PDF)</div>
            <div className="mt-1 text-lg font-medium text-white">Security Whitepaper</div>
          </a>
          <a
            href="#"
            className="block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 hover:bg-slate-900/60"
          >
            <div className="text-sm text-slate-400">Legal (PDF)</div>
            <div className="mt-1 text-lg font-medium text-white">Data Processing Addendum</div>
          </a>
        </div>
      </section>
    </main>
  );
}
