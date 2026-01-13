export const metadata = {
  title: "Roadmap | Solink",
  description: "Public development roadmap for Solink on Solana.",
};

export default function RoadmapPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-20">
      <h1 className="text-4xl font-bold mb-10">Public Roadmap</h1>

      <div className="space-y-10">
        <section className="rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-2">
            Phase 1 — Foundation (Month 0–1)
          </h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Node onboarding flow</li>
            <li>Metrics schema finalized</li>
            <li>Aggregation pipeline stabilized</li>
            <li>Internal monitoring and alerts</li>
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-2">
            Phase 2 — On-chain Prototype (Month 1–3)
          </h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Performance proof format defined</li>
            <li>Solana program deployed on testnet</li>
            <li>Node identity registration</li>
            <li>Reward calculation logic</li>
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 p-6">
          <h2 className="text-xl font-semibold mb-2">
            Phase 3 — Public Testnet (Month 3–6)
          </h2>
          <ul className="list-disc list-inside text-slate-300 space-y-1">
            <li>Permissionless node onboarding</li>
            <li>Public testnet launch</li>
            <li>Dashboard with on-chain verification</li>
            <li>Early partner participation</li>
          </ul>
        </section>

        <section className="rounded-xl border border-white/5 bg-white/5 p-6">
          <h2 className="text-lg font-semibold mb-2">
            Long-term Direction
          </h2>
          <p className="text-slate-300">
            Reputation systems, slashing mechanisms, cross-DePIN integrations,
            and increased decentralization of aggregation.
          </p>
        </section>
      </div>
    </main>
  );
}
