// app/resources/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import SectionTitle from "@/components/SectionTitle";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Resources — Solink",
  description: "Docs, changelog, and updates.",
  robots: { index: true, follow: true },
};

const CARDS = [
  {
    title: "Quickstart",
    desc: "Install the node and start sharing bandwidth in minutes.",
    href: "/resources/quickstart",
  },
  {
    title: "SDK Guide",
    desc: "Integrate Solink features into your app or workflow.",
    href: "/resources/sdk",
  },
  {
    title: "Security",
    desc: "Practices, audits, and how we protect the network.",
    href: "/resources/security",
  },
  {
    title: "Changelog",
    desc: "What’s new in the product, week by week.",
    href: "/resources/changelog",
  },
  {
    title: "FAQ",
    desc: "Common questions about rewards, nodes, and privacy.",
    href: "/resources/faq",
  },
  {
    title: "API Reference",
    desc: "HTTP endpoints, schemas, and examples.",
    href: "/resources/api",
  },
];

export default function ResourcesPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16" translate="no">
      <Reveal>
        <header className="text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Resources</h1>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">
            Documentation, examples, and updates to help you ship with Solink.
          </p>
        </header>
      </Reveal>

      <section className="mt-12">
        <Reveal>
          <SectionTitle title="Documentation" subtitle="Start here or jump to what you need." />
        </Reveal>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map((c, i) => (
            <Reveal key={c.title} delay={0.05 * i}>
              <Link
                href={c.href as any}
                className="group block rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition-colors hover:bg-slate-900/60"
                aria-label={`${c.title} — ${c.desc}`}
              >
                <div className="text-white font-medium">{c.title}</div>
                <p className="mt-2 text-sm text-slate-300">{c.desc}</p>
                <div className="mt-3 text-xs text-sky-400 group-hover:text-sky-300">
                  Read more →
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
