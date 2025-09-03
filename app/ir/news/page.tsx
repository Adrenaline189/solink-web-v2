import type { Metadata } from "next";
import NewsLink from "@/components/NewsLink";

export const metadata: Metadata = {
  title: "IR — News",
  description: "Solink investor relations news.",
};

type NewsItem = {
  slug: string;
  title: string;
  date: string;
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

export default function IRNewsPage() {
  return (
    <div className="mx-auto max-w-5xl p-6">
      <h1 className="text-3xl font-bold tracking-tight">Investor Relations — News</h1>
      <p className="text-slate-400 mt-2">Official updates and announcements for investors.</p>

      <div className="mt-6 grid gap-4">
        {NEWS.map((n) => (
          <article key={n.slug} className="rounded-xl border border-slate-800 p-5 bg-slate-900/40">
            <h2 className="text-xl font-semibold">{n.title}</h2>
            <p className="text-slate-500 text-sm mt-1">{n.date}</p>
            <p className="text-slate-300 text-sm mt-2">{n.summary}</p>

            <NewsLink
              slug={n.slug}
              className="inline-block mt-3 rounded-lg border border-slate-700 px-3 py-2 hover:bg-slate-800 text-sm"
            >
              Read more
            </NewsLink>
          </article>
        ))}
      </div>
    </div>
  );
}
