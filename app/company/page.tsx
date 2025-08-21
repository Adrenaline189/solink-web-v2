import type { Metadata } from "next";
import SectionTitle from "@/components/SectionTitle";

export const metadata: Metadata = {
  title: "Company — Solink",
  description: "About the company.",
  robots: { index: false, follow: false },
};

export default function CompanyPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="text-4xl font-semibold tracking-tight">Company</h1>
        <p className="mt-4 max-w-2xl text-slate-300">
          We are building an elastic bandwidth network that’s simple to adopt, transparent to operate, and safe to scale.
        </p>
      </header>

      <section className="mt-12">
        <SectionTitle title="Mission" />
        <p className="max-w-3xl text-slate-300">
          Lower the cost of reliable bandwidth while raising the bar for security and transparency.
        </p>
      </section>

      <section className="mt-16">
        <SectionTitle title="Team" subtitle="Replace placeholders with real photos and bios." />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {["Founder / CEO", "Co-founder / CTO", "Head of Product"].map((role) => (
            <div key={role} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <div className="mb-3 h-20 w-20 rounded-full bg-slate-800" />
              <div className="text-white">Name Surname</div>
              <div className="text-sm text-slate-400">{role}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-2xl border border-slate-800 bg-slate-900/50 p-6">
        <h3 className="text-xl font-semibold text-white">We’re hiring</h3>
        <p className="mt-2 text-slate-300">Help us build the network. Roles across engineering, product, and GTM.</p>
        <div className="mt-4">
          <a href="#" className="inline-block rounded-xl bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">
            See open roles
          </a>
        </div>
      </section>
    </main>
  );
}
