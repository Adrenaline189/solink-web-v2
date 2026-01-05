import type { Metadata } from "next";
import Link from "next/link";

type Params = { slug: string };

export function generateMetadata({ params }: { params: Params }): Metadata {
  const title = params.slug.replace(/-/g, " ");
  return {
    title: `IR — ${title}`,
    description: `Solink Investor Relations update: ${title}`,
  };
}

type IRArticle = {
  title: string;
  date: string;
  category: string;
  summary: string[];
  sections: { heading: string; body: string[] }[];
};

const NEWS: Record<string, IRArticle> = {
  "q2-2025-update": {
    title: "Q2 2025 Business Update",
    date: "August 1, 2025",
    category: "Business Update",
    summary: [
      "Continued growth in active nodes and geographic coverage.",
      "Improved network quality through Quality Factor (QF) tuning.",
      "Expanded enterprise pilots and early partner integrations.",
    ],
    sections: [
      {
        heading: "Network Performance",
        body: [
          "During Q2 2025, Solink expanded node coverage across multiple regions, improving redundancy and average latency.",
          "Quality Factor (QF) adjustments reduced reward variance while maintaining fair incentives for high-quality nodes.",
        ],
      },
      {
        heading: "Product & Engineering",
        body: [
          "The team focused on stabilizing the control plane and improving observability tooling.",
          "Early versions of policy-based routing and region pinning were deployed in pilot environments.",
        ],
      },
      {
        heading: "Outlook",
        body: [
          "In the next quarter, Solink will prioritize scalability, partner onboarding, and additional compliance tooling.",
          "The roadmap remains aligned with progressive decentralization and DAO governance milestones.",
        ],
      },
    ],
  },

  "series-a-extension": {
    title: "Series A Extension Closed",
    date: "July 10, 2025",
    category: "Financing",
    summary: [
      "Follow-on financing completed to extend runway.",
      "Capital allocated toward product scaling and security.",
      "No change to long-term decentralization roadmap.",
    ],
    sections: [
      {
        heading: "Transaction Overview",
        body: [
          "Solink has closed a Series A extension round with participation from existing strategic investors.",
          "The round strengthens the company’s balance sheet while maintaining disciplined capital allocation.",
        ],
      },
      {
        heading: "Use of Proceeds",
        body: [
          "Funds will be directed toward protocol development, security audits, and ecosystem growth.",
          "Additional resources will be allocated to enterprise onboarding and compliance readiness.",
        ],
      },
      {
        heading: "Strategic Direction",
        body: [
          "This financing does not alter Solink’s long-term vision of decentralization and token-aligned incentives.",
          "The company remains committed to transparency and regular investor communications.",
        ],
      },
    ],
  },
};

export default function IRNewsDetail({ params }: { params: Params }) {
  const item = NEWS[params.slug];

  if (!item) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Not found</h1>
        <p className="text-slate-400 mt-2">This investor update does not exist.</p>
        <Link href="/ir/news" className="mt-4 inline-block text-sky-300 hover:underline">
          ← Back to IR News
        </Link>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6" translate="no">
      <Link href="/ir/news" className="text-sky-300 hover:underline text-sm">
        ← Back to IR News
      </Link>

      {/* Header */}
      <header className="mt-4">
        <div className="text-xs uppercase tracking-wide text-slate-500">
          {item.category}
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {item.title}
        </h1>
        <p className="text-slate-500 text-sm mt-1">{item.date}</p>
      </header>

      {/* Executive Summary */}
      <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-semibold">Executive Summary</h2>
        <ul className="mt-3 list-disc pl-5 space-y-1 text-slate-300 text-sm">
          {item.summary.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </section>

      {/* Content */}
      <article className="mt-10 space-y-8">
        {item.sections.map((sec, i) => (
          <section key={i}>
            <h3 className="text-xl font-semibold">{sec.heading}</h3>
            <div className="mt-2 space-y-3 text-slate-300 text-sm">
              {sec.body.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
            </div>
          </section>
        ))}
      </article>

      {/* Disclaimer */}
      <section className="mt-12 border-t border-slate-800 pt-4">
        <p className="text-xs text-slate-500">
          This update may contain forward-looking statements. Actual results may differ materially.
          This communication is provided for informational purposes only.
        </p>
      </section>
    </main>
  );
}
