// app/resources/ResourcesClient.tsx
"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";
import Reveal from "@/components/Reveal";
import {
  BookOpen,
  Rocket,
  Shield,
  ScrollText,
  HelpCircle,
  Code2,
  ArrowRight,
  Search,
  Sparkles,
  LifeBuoy,
  Newspaper,
  Download,
  ExternalLink,
} from "lucide-react";

type Card = {
  title: string;
  desc: string;
  href: string;
  tag: "Docs" | "Updates" | "Support";
  icon: React.ReactNode;
};

const CARDS: Card[] = [
  {
    title: "Quickstart",
    desc: "Install the node and start sharing bandwidth in minutes.",
    href: "/resources/quickstart",
    tag: "Docs",
    icon: <Rocket className="h-5 w-5" />,
  },
  {
    title: "SDK Guide",
    desc: "Integrate Solink features into your app or workflow.",
    href: "/resources/sdk",
    tag: "Docs",
    icon: <Code2 className="h-5 w-5" />,
  },
  {
    title: "API Reference",
    desc: "HTTP endpoints, schemas, and examples.",
    href: "/resources/api",
    tag: "Docs",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    title: "Security",
    desc: "Practices, audits, and how we protect the network.",
    href: "/resources/security",
    tag: "Docs",
    icon: <Shield className="h-5 w-5" />,
  },
  {
    title: "Changelog",
    desc: "What’s new in the product, week by week.",
    href: "/resources/changelog",
    tag: "Updates",
    icon: <ScrollText className="h-5 w-5" />,
  },
  {
    title: "FAQ",
    desc: "Common questions about rewards, nodes, and privacy.",
    href: "/resources/faq",
    tag: "Support",
    icon: <HelpCircle className="h-5 w-5" />,
  },
];

const UPDATES = [
  {
    title: "Dashboard metrics rollup",
    desc: "Hourly aggregation for uptime, latency and rewards visibility.",
    date: "Recent",
    href: "/resources/changelog",
  },
  {
    title: "Quality Factor (QF) improvements",
    desc: "More stable scoring using latency + uptime smoothing.",
    date: "Recent",
    href: "/resources/changelog",
  },
  {
    title: "Referral tracking updates",
    desc: "Cleaner attribution and easier sharing links.",
    date: "Recent",
    href: "/resources/changelog",
  },
];

function Chip({ children }: React.PropsWithChildren) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 backdrop-blur">
      {children}
    </span>
  );
}

function CardLink({ c }: { c: Card }) {
  return (
    <Link
      href={c.href as any}
      className="group block rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur transition
                 hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
      aria-label={`${c.title} — ${c.desc}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white/90">
            {c.icon}
          </div>
          <div>
            <div className="text-white font-semibold">{c.title}</div>
            <p className="mt-1 text-sm text-white/75 leading-relaxed">{c.desc}</p>
          </div>
        </div>

        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/75">
          {c.tag}
        </span>
      </div>

      <div className="mt-4 inline-flex items-center gap-2 text-sm text-sky-300 group-hover:text-sky-200">
        Read more <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

export default function ResourcesClient() {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!query) return CARDS;
    return CARDS.filter((c) => {
      const hay = `${c.title} ${c.desc} ${c.tag}`.toLowerCase();
      return hay.includes(query);
    });
  }, [query]);

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-16" translate="no">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="absolute bottom-8 right-6 h-64 w-64 rounded-full bg-cyan-500/15 blur-3xl" />
      </div>

      {/* HERO */}
      <Reveal>
        <header className="text-center">
          <div className="flex flex-wrap justify-center gap-2">
            <Chip>
              <Sparkles className="h-4 w-4" /> Public testnet
            </Chip>
            <Chip>
              <BookOpen className="h-4 w-4" /> Docs & Guides
            </Chip>
            <Chip>
              <Newspaper className="h-4 w-4" /> Changelog
            </Chip>
            <Chip>
              <LifeBuoy className="h-4 w-4" /> Support
            </Chip>
          </div>

          <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Resources
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/75 leading-relaxed">
            Documentation, examples, and updates to help you ship with Solink.
          </p>

          {/* Quick links (keeps Resources as reading hub, not a download hub) */}
          <div className="mx-auto mt-6 flex flex-wrap justify-center gap-2">
            <Link
              href={"/download" as any}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            >
              <Download className="h-4 w-4" /> Downloads
            </Link>
            <Link
              href={"/whitepaper" as any}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            >
              Whitepaper <ExternalLink className="h-4 w-4" />
            </Link>
            <Link
              href={"/resources/api" as any}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            >
              API Reference <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Search */}
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <Search className="h-4 w-4 text-white/60" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search docs… (quickstart, api, security, faq)"
                className="w-full bg-transparent text-sm text-white placeholder:text-white/50 outline-none"
              />
            </div>
            <div className="mt-2 text-xs text-white/55">
              Tip: try <span className="text-white/80">api</span>,{" "}
              <span className="text-white/80">security</span>,{" "}
              <span className="text-white/80">quickstart</span>.
            </div>
          </div>
        </header>
      </Reveal>

      {/* CARDS */}
      <section className="mt-12">
        <Reveal>
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Documentation</h2>
              <p className="mt-1 text-sm text-white/70">
                Start here or jump to what you need.
              </p>
            </div>
            <div className="text-xs text-white/55">
              Showing{" "}
              <span className="text-white/80 font-semibold">{filtered.length}</span>{" "}
              items
            </div>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c, i) => (
            <Reveal key={c.title} delay={0.05 * i}>
              <CardLink c={c} />
            </Reveal>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/75">
            No results for <span className="text-white font-semibold">“{q}”</span>.
            Try <span className="text-white/90">api</span>,{" "}
            <span className="text-white/90">security</span>,{" "}
            <span className="text-white/90">quickstart</span>.
          </div>
        )}
      </section>

      {/* UPDATES */}
      <section className="mt-14">
        <Reveal>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Latest updates</h2>
              <p className="mt-1 text-sm text-white/70">
                Highlights from recent development.
              </p>
            </div>
            <Link
              href={"/resources/changelog" as any}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition"
            >
              View changelog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {UPDATES.map((u, i) => (
            <Reveal key={u.title} delay={0.05 * i}>
              <Link
                href={u.href as any}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur hover:bg-white/10 transition block"
              >
                <div className="text-xs text-white/55">{u.date}</div>
                <div className="mt-2 font-semibold text-white">{u.title}</div>
                <div className="mt-2 text-sm text-white/75 leading-relaxed">
                  {u.desc}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SUPPORT CTA */}
      <section className="mt-14">
        <Reveal>
          <div className="rounded-[28px] border border-white/10 bg-gradient-to-tr from-fuchsia-600/15 to-cyan-500/15 p-7 md:p-10 backdrop-blur">
            <div className="grid gap-5 md:grid-cols-2 md:items-center">
              <div>
                <h3 className="text-2xl font-semibold text-white">
                  Need help integrating?
                </h3>
                <p className="mt-2 text-white/75 leading-relaxed">
                  If you’re running a pilot or need policy/routing guidance, we can
                  help you set up templates and dashboards for your use case.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <Link
                  href={"/contact" as any}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-white/90 transition"
                >
                  Contact us <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={"/solutions" as any}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  See solutions <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>
    </main>
  );
}
