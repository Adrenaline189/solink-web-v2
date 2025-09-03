import type { Metadata } from "next";
import Link from "next/link";

type Params = { slug: string };

export function generateMetadata({ params }: { params: Params }): Metadata {
  const title = params.slug.replace(/-/g, " ");
  return {
    title: `IR — ${title}`,
    description: `Investor Relations update: ${title}`,
  };
}

const NEWS = {
  "q2-2025-update": {
    title: "Q2 2025 Business Update",
    date: "2025-08-01",
    body:
      "Quarterly highlights covering performance, user growth, and network quality improvements. " +
      "This is placeholder content — replace with your real article body.",
  },
  "series-a-extension": {
    title: "Series A Extension Closed",
    date: "2025-07-10",
    body:
      "We have closed a follow-on financing to accelerate the product roadmap. " +
      "Add more details, metrics, and forward-looking statements here.",
  },
} as const;

export default function IRNewsDetail({ params }: { params: Params }) {
  const item = (NEWS as Record<string, { title: string; date: string; body: string }>)[params.slug];

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-slate-400 mt-2">This news item doesn’t exist.</p>
        <Link href="/ir/news" className="mt-4 inline-block text-sky-300 hover:underline">
          ← Back to news
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <Link href="/ir/news" className="text-sky-300 hover:underline text-sm">
        ← Back to news
      </Link>

      <h1 className="mt-3 text-3xl font-bold tracking-tight">{item.title}</h1>
      <p className="text-slate-500 text-sm mt-1">{item.date}</p>

      <article className="prose prose-invert mt-6 max-w-none">
        <p>{item.body}</p>
      </article>
    </div>
  );
}
