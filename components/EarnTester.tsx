"use client";

import React, { useState } from "react";

type EarnType = "extension_farm" | "referral_bonus";

export default function EarnTester() {
  const [wallet, setWallet] = useState("demo_wallet");
  const [type, setType] = useState<EarnType>("extension_farm");
  const [amount, setAmount] = useState(50);

  // meta fields by type
  const [session, setSession] = useState<string>(() => `dash-${Date.now()}`);
  const [referredUserId, setReferredUserId] = useState<string>("");

  const [resText, setResText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleEarn() {
    setLoading(true);
    setResText(null);

    // build meta according to schema
    const meta =
      type === "extension_farm"
        ? { session: session || `dash-${Date.now()}` }
        : { referredUserId };

    try {
      const res = await fetch("/api/dev/earn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet,
          type,
          amount: Number(amount) || 0,
          meta,
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
    <div className="rounded-2xl border border-gray-200/10 bg-black/20 p-4 mt-6">
      <h2 className="text-lg font-semibold mb-3">Developer Test Earn</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <input
          className="rounded-lg border border-gray-700 p-2 bg-gray-900 text-white"
          value={wallet}
          onChange={(e) => setWallet(e.target.value)}
          placeholder="wallet address for demo-login"
