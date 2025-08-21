'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

const FEATURES = {
  Starter: ['Community support', 'Basic analytics', 'Up to 1 TB/month'],
  Growth: ['Email support', 'Advanced analytics', 'Up to 20 TB/month'],
  Enterprise: ['SLA & SSO/SAML', 'Custom limits', 'Dedicated support'],
};

export default function PricingClient({ locale }: { locale: string }) {
  const [annual, setAnnual] = useState(true);
  const price = (m: number) => (annual ? Math.round(m * 10 * 0.85) : m); // 15% off annually

  return (
    <>
      <header className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Pricing</h1>
        <p className="mx-auto mt-4 max-w-2xl text-slate-300">
          Simple plans with usage-based add-ons. Start small and scale confidently.
        </p>
      </header>

      {/* Billing cycle toggle */}
      <div className="mt-8 flex items-center justify-center gap-3 text-sm">
        <span className={!annual ? 'text-white' : 'text-slate-400'}>Monthly</span>
        <button
          onClick={() => setAnnual((v) => !v)}
          className="relative h-6 w-12 rounded-full border border-slate-700 bg-slate-900"
          aria-label="Toggle billing cycle"
          aria-pressed={annual ? 'true' : 'false'}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
              annual ? 'left-6' : 'left-1'
            }`}
          />
        </button>
        <span className={annual ? 'text-white' : 'text-slate-400'}>
          Annual <span className="text-xs text-slate-400">(save 15%)</span>
        </span>
      </div>

      {/* Plans */}
      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {[
          { name: 'Starter', mo: 0, cta: 'Get started' },
          { name: 'Growth', mo: 299, cta: 'Start trial' },
          { name: 'Enterprise', mo: 0, cta: 'Contact sales' },
        ].map((p) => (
          <div key={p.name} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-semibold text-white">{p.name}</h3>
              <div className="text-right">
                {p.name === 'Enterprise' ? (
                  <div className="text-lg text-slate-300">Custom</div>
                ) : (
                  <>
                    <div className="text-3xl font-bold text-white">${price(p.mo)}</div>
                    <div className="text-xs text-slate-400">
                      per month{annual && ' (annualized)'}
                    </div>
                  </>
                )}
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm">
              {FEATURES[p.name as keyof typeof FEATURES].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 text-slate-200" />
                  <span className="text-slate-300">{f}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <a
                href={
                  p.name === 'Enterprise'
                    ? `/${locale}/contact#contact-sales`
                    : `/${locale}/contact#get-started`
                }
                className="inline-block rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
              >
                {p.cta}
              </a>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}
