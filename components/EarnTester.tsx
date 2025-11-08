"use client";

import React, { useState } from "react";

export default function EarnTester() {
  const [wallet, setWallet] = useState("demo_wallet");
  const [type, setType] = useState("extension_farm");
  const [amount, setAmount] = useState(50);
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function handleEarn() {
    setLoading(true);
    setOut(null);
    setErr(null);
    try {
      const res = await fetch("/api/points/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // On the server we validate API_KEY via headers.
          "x-api-key": process.env.NEXT_PUBLIC_FAKE_HEADER ?? "solink_secret_12345",
        },
        body: JSON.stringify({ wallet, type, amount }),
      });
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setOut(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 shadow-sm">
      <div className="mb-3 font-semibold">Dev • Earn Points Tester</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Wallet</span>
          <input
            className="rounded-lg border p-2"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="wallet id"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Type</span>
          <input
            className="rounded-lg border p-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
            placeholder="extension_farm | referral | convert"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-gray-600">Amount</span>
          <input
            className="rounded-lg border p-2"
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="50"
            min={1}
          />
        </label>
      </div>

      <button
        onClick={handleEarn}
        disabled={loading}
        className="rounded-xl px-4 py-2 bg-black text-white disabled:opacity-60"
      >
        {loading ? "Sending..." : "Add Points"}
      </button>

      <div className="mt-4">
        {out && (
          <pre className="text-xs bg-gray-50 border rounded-lg p-3 overflow-auto">
            {out}
          </pre>
        )}
        {err && (
          <div className="text-sm text-red-600">
            {err}
          </div>
        )}
      </div>
    </div>
  );
}
