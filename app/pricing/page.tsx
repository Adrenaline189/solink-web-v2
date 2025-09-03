// app/pricing/page.tsx
import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Pricing — Solink",
  description: "Simple, transparent pricing for Solink.",
  robots: { index: true, follow: true },
};

const plans = [
  {
    name: "Starter",
    price: "Free",
    desc: "Best for getting started",
    features: ["Basic node", "Referral enabled", "Community support"],
    cta: "Start now",
  },
  {
    name: "Pro",
    price: "$9/mo",
    desc: "For active sharers",
    features: ["Higher daily cap", "Priority region routing", "Email support"],
    cta: "Upgrade",
  },
  {
    name: "Enterprise",
    price: "Contact",
    desc: "Custom throughput or fleet",
    features: ["Dedicated region", "SLA", "Account manager"],
    cta: "Contact sales",
  },
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <Reveal>
        <header>
          <h1 className="text-4xl font-extrabold mb-2">Pricing</h1>
          <p className="text-slate-400 mb-8">
            Simple plans that scale as you grow. Cancel anytime.
          </p>
        </header>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={0.06 * i}>
            <article className="rounded-2xl border border-slate-800 p-6 bg-slate-900/40">
              <div className="text-slate-200 font-semibold">{p.name}</div>
              <div className="text-3xl font-extrabold mt-2">{p.price}</div>
              <div className="text-slate-400 text-sm mt-1">{p.desc}</div>
              <ul className="text-slate-300 text-sm space-y-2 mt-4">
                {p.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <button
                className="mt-6 w-full rounded-xl bg-sky-600/90 hover:bg-sky-600 px-4 py-2 transition"
                aria-label={`Select ${p.name} plan`}
              >
                {p.cta}
              </button>
            </article>
          </Reveal>
        ))}
      </div>

      <Footer />
    </div>
  );
}
