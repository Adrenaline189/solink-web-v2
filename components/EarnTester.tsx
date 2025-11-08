"use client";

import React, { useState } from "react";

export default function EarnTester() {
  const [wallet, setWallet] = useState("demo_wallet");
  const [type, setType] = useState("extension_farm");
  const [amount, setAmount] = useState(50);
  const [resText, setResText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEarn() {
    setLoading(true);
    setResText(null);

    try {
      const res = await fetch("/api/points/earn", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": "solink_secret_12345",
        },
        body: JSON.stringify({
          wallet,
          type,
          amount,
          nonce: `dev-${Date.now()}`,
        }),
      });
      const data = await res.json();
      setResText(JSON.stringify(data, null, 2));
    } catch (err) {
      setResText(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-black/10 p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Developer Test Earn</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          className="rounded-lg border p-2 bg-gray-900 text-white"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="wallet address"
        />
        <input
          className="rounded-lg border p-2 bg-gray-900 text-white"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="type"
        />
        <input
          className="rounded-lg border p-2 bg-gray-900 text-white"
          type="number"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          placeholder="amount"
        />
      </div>

      <button
        onClick={handleEarn}
        disabled={loading}
        className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-white font-medium"
      >
        {loading ? "Sending..." : "Add Points"}
      </button>

      {resText && (
        <pre className="mt-3 text-xs bg-black/40 text-green-400 rounded-lg p-3 overflow-x-auto">
          {resText}
        </pre>
      )}
    </div>
  );
}
