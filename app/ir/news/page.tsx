// app/ir/news/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Reveal from "@/components/Reveal";
import SeoJsonLd from "@/components/SeoJsonLd";
import { ArrowLeft, ArrowRight, CalendarDays, Newspaper } from "lucide-react";
import NewsLink from "@/components/NewsLink";

export const metadata: Metadata = {
  title: "IR — News",
  description: "Solink investor relations news.",
  alternates: { canonical: "/ir/news" },
  robots: { index: true, follow: true },
};

function getSiteUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl.replace(/\/$/, "")}`;
  return "https://www.solink.network";
}

type NewsItem = {
  slug: string;
  title: string;
  date: string; // YYYY-MM-DD
  summary: string;
};

const NEWS: NewsItem[] = [
  {
    slug: "q2-2025-update",
    title: "Q2 2025 Business Update",
    date: "2025-08-01",
    summary: "Highlights of performance, user growth, and network quality improvements.",
  },
  {
    slug: "series-a-extension",
    title: "Series A Extension Closed",
    date: "2025-07-10",
    summary: "We have closed a follow-on financing to accelerate product roadmap.",
  },
];

function formatDate(date: string) {
  const d = new Date(date + "T00:00:00Z");
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(d);
}

export default function IRNewsPage() {
  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "IR — News",
    url: `${siteUrl}/ir/news`,
    isPartOf: { "@type": "WebSite", name: "Solink", url: siteUrl },
  };

  return (
    <main className="relative mx-auto max-w-5xl px-6 py-16 text-slate-100" translate="no">
      <SeoJsonLd data={jsonLd} />

      {/* Glow BG */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-20 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/12 blur-3xl" />
        <div className="absolute bottom-10 right-10 h-64 w-64 rounded-full bg-cyan-500/12 blur-3xl" />
      </div>

      <Reveal>
        <header className="text-center">
          <Link
            href={"/ir" as any}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 hover:bg-white/10 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to IR
          </Link>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
            Investor Relations — News
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/75">
            Official updates and announcements for investors.
          </p>
        </header>
      </Reveal>

      <section className="mt-10 grid gap-4">
        {NEWS.map((n, i) => (
          <Reveal key={n.slug} delay={0.05 * i}>
            <article className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:bg-white/10 hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-white">{n.title}</h2>
                  <div className="mt-2 inline-flex items-center gap-2 text-xs text-white/60">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(n.date)}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/10 p-2">
                  <Newspaper className="h-5 w-5 text-white/80" />
                </div>
              </div>

              <p className="mt-4 text-sm text-white/75 leading-relaxed">{n.summary}</p>

              <div className="mt-5">
                <NewsLink
                  slug={n.slug}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
                >
                  Read more <ArrowRight className="h-4 w-4" />
                </NewsLink>
              </div>
            </article>
          </Reveal>
        ))}
      </section>
    </main>
  );
}
