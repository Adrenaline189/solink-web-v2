// app/resources/[slug]/page.tsx
import type { Metadata } from "next";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  const title = params.slug
    .split("-")
    .map((s) => s[0]?.toUpperCase() + s.slice(1))
    .join(" ");
  return {
    title: `${title} — Resources — Solink`,
    description: `Article: ${title}`,
  };
}

export default function ResourceArticle({ params }: { params: { slug: string } }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="text-xs text-slate-400">Resources</div>
      <h1 className="text-3xl font-bold mt-1">
        {params.slug.replace(/-/g, " ")}
      </h1>
      <p className="mt-3 text-slate-400">
        This article is coming soon. Stay tuned!
      </p>
      <div className="mt-8 h-48 rounded-2xl border border-slate-800 bg-slate-900/40" />
    </div>
  );
}
