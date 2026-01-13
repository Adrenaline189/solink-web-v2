export const metadata = {
  title: "Evidence | Solink",
  description: "Operational evidence of Solink’s infrastructure and monitoring system.",
};

export default function EvidencePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">System Evidence</h1>

      <p className="text-slate-300 max-w-3xl mb-12">
        Solink is not a concept-only project. A live infrastructure monitoring
        and aggregation system is already operational.
      </p>

      <section className="space-y-10">
        <div>
          <h2 className="text-2xl font-semibold mb-3">What Is Live Today</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Distributed heartbeat collection</li>
            <li>Latency and uptime measurement</li>
            <li>Quality scoring signals</li>
            <li>Realtime dashboard visualization</li>
            <li>Backend aggregation and validation</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Realtime Monitoring</h2>
          <p className="text-slate-300">
            Performance signals are continuously collected and aggregated.
            The dashboard provides real-time and historical visibility into
            network quality.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-6">
          <p className="text-sm text-slate-400">
            Note: Metrics shown publicly may be anonymized or illustrative.
            On-chain settlement is currently in testnet development.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Current Status</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Data collection: Live</li>
            <li>Aggregation pipeline: Live</li>
            <li>Dashboard: Live</li>
            <li>On-chain settlement: In progress</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
