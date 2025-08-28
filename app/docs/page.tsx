// app/docs/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Docs — Solink",
  description: "Solink API reference and integration guide.",
  robots: { index: true, follow: true },
};

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">API Documentation</h1>
      <p className="text-slate-400 mt-2">
        This is a placeholder. Add your REST endpoints, auth, webhooks, SDKs and examples here.
      </p>

      <h2 className="text-xl font-semibold mt-8">Quickstart</h2>
      <pre className="mt-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm overflow-x-auto">
        <code>{`# Get summary
curl -s https://your-domain.com/api/dashboard/summary | jq

# Webhook (example payload)
{
  "event": "points.updated",
  "data": { "user": "0xabc...", "points": 12500 }
}`}</code>
      </pre>

      <h2 className="text-xl font-semibold mt-8">Authentication</h2>
      <p className="text-slate-400 mt-2">
        Document how to obtain API keys / OAuth, and how to sign requests.
      </p>

      <h2 className="text-xl font-semibold mt-8">Webhooks</h2>
      <p className="text-slate-400 mt-2">
        Describe event types, retry policy, and security verification (signature/secret).
      </p>
    </section>
  );
}
