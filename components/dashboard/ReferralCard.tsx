"use client";
import { useState, useEffect, useCallback } from "react";
import { Users, Gift, TrendingUp, Copy, CheckCheck } from "lucide-react";

type ReferralStats = {
  ok: boolean;
  referralCode: string;
  referralUrl: string;
  referredCount: number;
  bonusToday: number;
  bonusThisWeek: number;
  bonusAllTime: number;
};

async function fetchReferralStats(signal?: AbortSignal): Promise<ReferralStats | null> {
  try {
    const res = await fetch("/api/dashboard/referral-stats", {
      cache: "no-store",
      credentials: "include",
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.ok ? json : null;
  } catch { return null; }
}

export default function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    const data = await fetchReferralStats(signal);
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    const interval = setInterval(() => load(ac.signal), 30_000);
    return () => { ac.abort(); clearInterval(interval); };
  }, [load]);

  async function copyLink() {
    if (!stats?.referralUrl) return;
    try {
      await navigator.clipboard.writeText(stats.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  const refCount = stats?.referredCount ?? 0;
  const bonusToday = stats?.bonusToday ?? 0;
  const bonusWeek = stats?.bonusThisWeek ?? 0;
  const bonusAll = stats?.bonusAllTime ?? 0;

  return (
    <div className="rounded-2xl border border-emerald-800/40 bg-emerald-950/20 p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="rounded-xl bg-emerald-900/30 border border-emerald-700/40 p-2">
          <Users className="size-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-semibold text-white">Invite & Earn</h3>
          <p className="text-xs text-slate-400">Earn bonus points for every friend you refer</p>
        </div>
      </div>

      {/* Referral link */}
      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-1.5">Your referral link</label>
        <div className="flex gap-2">
          <div className="flex-1 rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 truncate font-mono">
            {loading ? "—" : stats?.referralUrl ?? "—"}
          </div>
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 hover:border-slate-500 px-3 py-2 text-sm text-slate-300 transition shrink-0"
          >
            {copied ? <CheckCheck className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
            <span>{copied ? "Copied!" : "Copy"}</span>
          </button>
        </div>
        <p className="text-xs text-slate-500 mt-1">Code: <span className="font-mono text-slate-400">{loading ? "—" : stats?.referralCode ?? "—"}</span></p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-center">
          <div className="text-xs text-slate-500 mb-1">Referred</div>
          <div className="text-lg font-bold text-emerald-400">{loading ? "—" : refCount}</div>
          <div className="text-xs text-slate-500">users</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-center">
          <div className="text-xs text-slate-500 mb-1">This Week</div>
          <div className="text-lg font-bold text-white">{loading ? "—" : bonusWeek.toLocaleString()}</div>
          <div className="text-xs text-slate-500">pts</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 text-center">
          <div className="text-xs text-slate-500 mb-1">All Time</div>
          <div className="text-lg font-bold text-white">{loading ? "—" : bonusAll.toLocaleString()}</div>
          <div className="text-xs text-slate-500">pts</div>
        </div>
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-emerald-800/30 bg-emerald-950/20 p-3">
        <div className="text-xs font-semibold text-emerald-300 mb-2 flex items-center gap-1.5">
          <Gift className="size-3.5" />
          How it works
        </div>
        <div className="space-y-1.5 text-xs text-slate-400">
          <div className="flex gap-2">
            <span className="text-emerald-500 shrink-0">1.</span>
            <span>Share your referral link with friends</span>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-500 shrink-0">2.</span>
            <span>They sign up and start earning</span>
          </div>
          <div className="flex gap-2">
            <span className="text-emerald-500 shrink-0">3.</span>
            <span>You earn <span className="text-emerald-400 font-medium">bonus points</span> for every active referral</span>
          </div>
        </div>
      </div>
    </div>
  );
}
