export const metadata = {
  title: "How It Works | Solink",
  description: "How Solink measures, verifies, and settles infrastructure performance using Solana.",
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold mb-6">How Solink Works</h1>

      <p className="text-slate-300 max-w-3xl mb-12">
        Solink is a DePIN infrastructure performance layer that measures real-world
        network quality and makes those measurements verifiable and rewardable
        using Solana.
      </p>

      <section className="space-y-12">
        <div>
          <h2 className="text-2xl font-semibold mb-3">System Overview</h2>
          <p className="text-slate-300">
            Solink separates high-frequency telemetry from trust-critical settlement
            to achieve scalability without sacrificing verifiability.
          </p>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">1. Distributed Nodes</h3>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Measure uptime, latency, and connectivity</li>
            <li>Send signed heartbeat and quality signals</li>
            <li>Operate without custody of funds</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">2. Off-chain Aggregation</h3>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Normalize and aggregate raw telemetry</li>
            <li>Generate compact performance proofs</li>
            <li>Prepare data for on-chain verification</li>
          </ul>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-2">
            3. On-chain Verification (Solana)
          </h3>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Commit aggregated proof hashes</li>
            <li>Register node identities</li>
            <li>Calculate and settle rewards transparently</li>
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-3">Why Solana</h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>High throughput for frequent proof settlement</li>
            <li>Low transaction cost suitable for micro-rewards</li>
            <li>Fast finality for near-realtime verification</li>
            <li>Strong ecosystem alignment with DePIN</li>
          </ul>
        </div>

        <blockquote className="border-l-4 border-cyan-400 pl-4 italic text-slate-300">
          “Everything that must be trusted is on-chain.
          Everything that must scale stays off-chain.”
        </blockquote>
      </section>
    </main>
  );
}
