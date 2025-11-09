"use client";

import React, { useState } from "react";

type EarnType = "extension_farm" | "referral_bonus";

export default function EarnTester(): JSX.Element {
  const [wallet, setWallet] = useState("demo_wallet");
  const [type, setType] = useState<EarnType>("extension_farm");
  const [amount, setAmount] = useState<number>(50);

  const [session, setSession] = useState<string>(() => `dash-${Date.now()}`);
  const [referredUserId, setReferredUserId] = useState<string>("");

  const [resText, setResText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEarn() {
    setLoading(true);
    setResText(null);
    try {
      // สร้าง session ใหม่ทุกครั้งเพื่อกัน dedupe
      const freshSession = `dash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setSession(freshSession);

      const meta =
        type === "extension_farm"
          ? { session: freshSession }
          : { referredUserId };

      const res = await fetch("/api/dev/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          type,
          amount: Number(amount) || 0,
          meta,
          debug: true,
        }),
      });
      const data = await res.json();
      setResText(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setResText(String(err?.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200/10 bg-black/20 p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Developer Test Earn</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          className="rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="wallet address for demo-login"
        />

        <select
          className="rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
          value={type}
          onChange={(e) => setType(e.target.value as EarnType)}
        >
          <option value="extension_farm">extension_farm</option>
          <option value="referral_bonus">referral_bonus</option>
        </select>

        <input
          className="rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="amount"
        />
      </div>

      {type === "extension_farm" ? (
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">meta.session (auto)</label>
          <input
            className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
            value={session}
            onChange={(e) => setSession(e.target.value)}
            placeholder="auto-generated per click"
            readOnly
          />
        </div>
      ) : (
        <div className="mb-3">
          <label className="block text-xs text-gray-400 mb-1">meta.referredUserId (required)</label>
          <input
            className="w-full rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
            value={referredUserId}
            onChange={(e) => setReferredUserId(e.target.value)}
            placeholder="e.g. user_1234"
          />
        </div>
      )}

      <button
        onClick={handleEarn}
        disabled={loading}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-white font-medium"
      >
        {loading ? "Sending..." : "Add Points"}
      </button>

      {resText && (
        <pre className="mt-3 text-xs bg-black/40 text-emerald-400 rounded-lg p-3 overflow-x-auto">
          {resText}
        </pre>
      )}
    </div>
  );
}
