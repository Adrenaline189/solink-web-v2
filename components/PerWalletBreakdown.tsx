// components/PerWalletBreakdown.tsx
"use client";
import React, { useState } from "react";

export default function PerWalletBreakdown(): JSX.Element {
  const [walletsText, setWalletsText] = useState("demo_wallet_test1\ndemo_wallet_test2");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);

  const wallets = walletsText.split("\n").map(s => s.trim()).filter(Boolean);

  async function fetchBreakdown() {
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch("/api/dev/per-wallet-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallets }),
      });
      const j = await r.json();
      setRes(j);
    } catch (e: any) {
      setRes({ ok: false, error: String(e?.message || e) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/10 bg-black/20 p-4 mt-6">
      <h3 className="text-lg font-semibold mb-3">Per-Wallet Breakdown</h3>

      <div className="mb-3">
        <label className="block text-xs text-gray-400 mb-1">Wallets (one per line)</label>
        <textarea
          rows={4}
          className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
          value={walletsText}
          onChange={(e) => setWalletsText(e.target.value)}
        />
      </div>

      <div className="flex gap-3 mb-3">
        <button
          onClick={fetchBreakdown}
          disabled={loading || wallets.length === 0}
          className="rounded-lg bg-sky-600 hover:bg-sky-700 px-4 py-2 text-white"
        >
          {loading ? "Fetching..." : "Fetch Summary"}
        </button>
        <div className="text-sm text-slate-400">Wallets: {wallets.length}</div>
      </div>

      {res && (
        <pre className="mt-3 text-xs bg-black/40 text-emerald-400 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(res, null, 2)}
        </pre>
      )}
    </div>
  );
}
