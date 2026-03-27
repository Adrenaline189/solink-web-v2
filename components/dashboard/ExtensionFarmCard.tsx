"use client";
import { useState, useEffect, useCallback } from "react";
import { Activity, TrendingUp, Clock, Zap, XCircle, CheckCircle2, RefreshCw } from "lucide-react";

type FarmStats = {
  ok: boolean;
  farmPointsToday: number;
  farmPointsTotal: number;
  extensionActive: boolean;
  uptimeSeconds: number;
  lastHeartbeat: string | null;
  todayEarnings: number;
};

async function fetchFarmStats(signal?: AbortSignal): Promise<FarmStats | null> {
  try {
    const res = await fetch("/api/dashboard/farm-stats", {
      cache: "no-store",
      credentials: "include",
      signal,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.ok ? json : null;
  } catch {
    return null;
  }
}

export default function ExtensionFarmCard() {
  const [stats, setStats] = useState<FarmStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<string>("");

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    const data = await fetchFarmStats(signal);
    setStats(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    const interval = setInterval(() => load(ac.signal), 10_000);
    return () => { ac.abort(); clearInterval(interval); };
  }, [load]);

  async function simulateFarm() {
    setSimulating(true);
    setSimResult("");
    try {
      const r = await fetch("/api/dashboard/farm-stats", { method: "POST", cache: "no-store", credentials: "include" });
      const j = await r.json();
      if (j.ok) {
        setStats(j);
        setSimResult("✅ Extension farm simulated! Points credited.");
      } else {
        setSimResult(j.error || "Failed to simulate.");
      }
    } catch (e: any) {
      setSimResult(e?.message || "Error");
    } finally {
      setSimulating(false);
    }
  }

  const extActive = stats?.extensionActive ?? false;
  const farmPoints = stats?.farmPointsTotal ?? 0;
  const farmToday = stats?.farmPointsToday ?? 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-xl bg-amber-900/30 border border-amber-700/40 p-2">
            <Zap className="size-5 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Extension Farm</h3>
            <p className="text-xs text-slate-400">Earn points via browser extension</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {extActive
            ? <><CheckCircle2 className="size-4 text-emerald-400" /><span className="text-xs text-emerald-400">Active</span></>
            : <><XCircle className="size-4 text-slate-500" /><span className="text-xs text-slate-500">Inactive</span></>
          }
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Today</div>
          <div className="text-lg font-bold text-amber-400">{loading ? "—" : farmToday.toLocaleString()}</div>
          <div className="text-xs text-slate-500">pts</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Total</div>
          <div className="text-lg font-bold text-white">{loading ? "—" : farmPoints.toLocaleString()}</div>
          <div className="text-xs text-slate-500">pts</div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 text-center">
          <div className="text-xs text-slate-500 mb-1">Uptime</div>
          <div className="text-lg font-bold text-emerald-400">
            {loading ? "—" : stats ? `${Math.floor((stats.uptimeSeconds || 0) / 3600)}h ${Math.floor(((stats.uptimeSeconds || 0) % 3600) / 60)}m` : "—"}
          </div>
          <div className="text-xs text-slate-500">today</div>
        </div>
      </div>

      {/* Status bar */}
      {extActive && (
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
          <Activity className="size-3.5 text-emerald-400 animate-pulse" />
          <span>Extension connected — earning points automatically</span>
        </div>
      )}

      {/* Simulate button (for testing without real extension) */}
      <button
        onClick={simulateFarm}
        disabled={simulating}
        className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-700/50 bg-amber-900/20 hover:bg-amber-900/40 px-4 py-2 text-sm text-amber-300 transition disabled:opacity-50"
      >
        {simulating
          ? <><RefreshCw className="size-4 animate-spin" /> Simulating...</>
          : <><Zap className="size-4" /> Simulate Extension Farm</>
        }
      </button>

      {simResult && (
        <div className="mt-2 text-xs text-slate-400 text-center">{simResult}</div>
      )}
    </div>
  );
}
