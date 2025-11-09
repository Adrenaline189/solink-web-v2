// components/TurboFarm.tsx
"use client";
import React, { useState } from "react";

export default function TurboFarm(): JSX.Element {
  const [walletsText, setWalletsText] = useState("demo_wallet_test1\ndemo_wallet_test2");
  const [type, setType] = useState<"extension_farm" | "referral_bonus">("extension_farm");
  const [amount, setAmount] = useState<number>(50);
  const [bursts, setBursts] = useState<number>(40);
  const [concurrency, setConcurrency] = useState<number>(5);
  const [minDelayMs, setMinDelayMs] = useState<number>(150);
  const [jitterMs, setJitterMs] = useState<number>(100);
  const [stopAtCap, setStopAtCap] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [resText, setResText] = useState<string>("");

  const wallets = walletsText.split("\n").map(s => s.trim()).filter(Boolean);

  async function runTurbo() {
    setLoading(true);
    setResText("");
    try {
      const r = await fetch("/api/dev/turbo-earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallets,
          type,
          amount,
          bursts,
          concurrency,
          minDelayMs,
          jitterMs,
          stopAtCap,
          meta: {},
        }),
      });
      const j = await r.json();
      setResText(JSON.stringify(j, null, 2));
    } catch (e: any) {
      setResText(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/10 bg-black/20 p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Turbo Farm</h2>

      <div className="grid md:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Wallets (1 per line)</label>
          <textarea
            rows={5}
            className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
            value={walletsText}
            onChange={(e) => setWalletsText(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-gray-400 mb-1">Type</label>
            <select
              className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
              value={type}
              onChange={(e) => setType(e.target.value as any)}
            >
              <option value="extension_farm">extension_farm</option>
              <option value="referral_bonus">referral_bonus</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
              value={amount}
              onChange={e => setAmount(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Bursts / wallet</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
              value={bursts}
              onChange={e => setBursts(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Concurrency</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
              value={concurrency}
              onChange={e => setConcurrency(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Min delay (ms)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
              value={minDelayMs}
              onChange={e => setMinDelayMs(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Jitter (ms)</label>
            <input
              type="number"
              className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
              value={jitterMs}
              onChange={e => setJitterMs(Number(e.target.value))}
            />
          </div>

          <div className="col-span-2">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={stopAtCap} onChange={(e) => setStopAtCap(e.target.checked)} />
              <span className="text-xs text-gray-400">Stop at daily cap</span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={runTurbo}
          disabled={loading || wallets.length === 0}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-white font-medium"
        >
          {loading ? "Farming..." : "Start Turbo Farm"}
        </button>
        <div className="text-sm text-slate-400">Wallets: {wallets.length}</div>
      </div>

      {resText && (
        <pre className="mt-3 text-xs bg-black/40 text-emerald-400 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
          {resText}
        </pre>
      )}
    </div>
  );
}
