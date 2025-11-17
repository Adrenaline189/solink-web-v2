// app/dashboard/page.tsx
"use client";

import type { DashboardRange } from "@/types/dashboard";

import NextDynamic from "next/dynamic";
const WalletMultiButton = NextDynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

import { Suspense, useEffect, useState, useCallback, useMemo } from "react";
export const dynamic = "force-dynamic";

import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Link2, Gauge, Award, Activity, Cloud, TrendingUp, BarChart4 } from "lucide-react";

import type { DashboardSummary, HourlyPoint, Tx } from "../../types/dashboard";
import { fetchDashboardSummary, fetchHourly, fetchTransactions } from "../../lib/data/dashboard";

import HourlyPoints from "../../components/charts/HourlyPoints";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrefs } from "../../lib/prefs-client";

/* Recharts (ใช้สำหรับกราฟ System Hourly จาก /api/dashboard/metrics) */
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

/* ---------------------------------- types ----------------------------------- */
type SystemHourRow = { hourUtc: string; pointsEarned: number };
type SystemMetricsResp = {
  ok: boolean;
  daily: { dayUtc: string; pointsEarned: number } | null;
  hourly: SystemHourRow[];
};

type AuthMeta = {
  wallet: string;
  ts: number;
};

/* ---------------------------------- const ----------------------------------- */
const TX_PAGE_SIZE = 20;
const AUTH_META_KEY = "solink_auth_meta";
// เช่น ให้จำว่า login แล้วภายใน 24 ชม. ไม่ต้องขอ signMessage ใหม่
const AUTH_META_TTL_MS = 24 * 60 * 60 * 1000;

/* ---------------------------------- page ----------------------------------- */

function DashboardInner() {
  // Summary + user hourly + tx
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [txData, setTxData] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [range, setRange] = useState<DashboardRange>("today");
  const { prefs } = usePrefs();
  const tz = "UTC"; // ใช้โซนเวลาสากลแบบคงที่

  const { publicKey, connected, signMessage } = useWallet();
  const address = publicKey?.toBase58();
  const [refLink, setRefLink] = useState("");
  const [copied, setCopied] = useState(false);

  // ---- System Metrics (GLOBAL) ----
  const [sysLoading, setSysLoading] = useState(true);
  const [sysError, setSysError] = useState<string | null>(null);
  const [sysDaily, setSysDaily] = useState<number>(0);
  const [sysHourly, setSysHourly] = useState<SystemHourRow[]>([]);

  // Recent tx pagination
  const [txVisible, setTxVisible] = useState<number>(TX_PAGE_SIZE);

  // refetch interval (ms)
  const SYS_REFRESH_MS = 30_000;

  /* Referral link (local only for ตอนนี้) */
  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://solink.network";
    const code = address ? address.slice(0, 8) : (typeof window !== "undefined" ? (localStorage.getItem("solink_ref_code") || "") : "");
    const finalCode =
      code ||
      (() => {
        const c = Math.random().toString(36).slice(2, 10);
        try {
          if (typeof window !== "undefined") {
            localStorage.setItem("solink_ref_code", c);
          }
        } catch {}
        return c;
      })();
    setRefLink(`${origin.replace(/\/$/, "")}/r/${encodeURIComponent(finalCode)}`);
  }, [address]);

  /* sync wallet -> prefs API */
  useEffect(() => {
    if (!address || !connected) return;
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("solink_wallet", address);
      }
      document.cookie = `solink_wallet=${address}; Path=/; SameSite=Lax; Max-Age=2592000`;
    } catch {}
    fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
    }).catch(() => {});
  }, [address, connected]);

  /* helper: อ่าน/เขียน auth meta ใน localStorage */
  const getAuthMeta = useCallback((): AuthMeta | null => {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(AUTH_META_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.wallet === "string" && typeof parsed.ts === "number") {
        return parsed as AuthMeta;
      }
    } catch {}
    return null;
  }, []);

  const setAuthMeta = useCallback((meta: AuthMeta) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(AUTH_META_KEY, JSON.stringify(meta));
    } catch {}
  }, []);

  const clearAuthMeta = useCallback(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.removeItem(AUTH_META_KEY);
    } catch {}
  }, []);

  /* 👇 Login จริงด้วย signMessage → /api/auth/login 
     แต่จะเรียกเฉพาะตอน "ยังไม่เคยล็อกอิน หรือเกิน TTL" */
  const loginWithWallet = useCallback(async () => {
    if (!connected || !publicKey || !signMessage) return;

    const wallet = publicKey.toBase58();
    const now = Date.now();

    // เช็กว่าเคย login แล้วในช่วง AUTH_META_TTL_MS มั้ย
    const meta = getAuthMeta();
    if (meta && meta.wallet === wallet && now - meta.ts < AUTH_META_TTL_MS) {
      // ✅ เคย login ไม่เกิน 24 ชม. ข้ามการ signMessage
      return;
    }

    try {
      const ts = Date.now();
      const message = `Solink Login :: wallet=${wallet} :: ts=${ts}`;
      const encoded = new TextEncoder().encode(message);

      const sig = await signMessage(encoded);
      const signatureB64 = u8ToBase64(sig);

      await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet, ts, signature: signatureB64 }),
      });

      // จำไว้ว่า wallet นี้ login แล้วตอน ts นี้
      setAuthMeta({ wallet, ts: Date.now() });
      // cookie solink_auth จะถูกเซ็ตโดย /api/auth/login
    } catch (e) {
      console.error("loginWithWallet failed:", e);
    }
  }, [connected, publicKey, signMessage, getAuthMeta, setAuthMeta]);

  /* เรียก loginWithWallet แค่ตอน connect + มี signMessage เท่านั้น */
  useEffect(() => {
    if (!connected || !publicKey || !signMessage) return;
    loginWithWallet();
  }, [connected, publicKey, signMessage, loginWithWallet]);

  /* ถ้า disconnect → ล้าง meta ทิ้ง (ไว้เป็น behavior แบบ logout) */
  useEffect(() => {
    if (!connected) {
      clearAuthMeta();
    }
  }, [connected, clearAuthMeta]);

  /* load summary + user hourly + tx */
  const refresh = useCallback(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const [s, h, t] = await Promise.all([
          fetchDashboardSummary(ac.signal),
          fetchHourly(range, ac.signal),
          fetchTransactions(range, ac.signal),
        ]);
        setSummary(s ?? null);
        setHourly(Array.isArray(h) ? h : []);
        setTxData(Array.isArray(t) ? t : []);
        setErr(null);
      } catch (e: any) {
        setErr(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
    return () => ac.abort();
  }, [range]);

  useEffect(() => {
    const cleanup = refresh();
    return cleanup;
  }, [refresh]);

  /* reset tx visible เมื่อชุด tx เปลี่ยน (เปลี่ยน range หรือ fetch ใหม่) */
  useEffect(() => {
    setTxVisible(TX_PAGE_SIZE);
  }, [txData]);

  /* load System Metrics จาก /api/dashboard/metrics + auto refresh */
  const loadSystemMetrics = useCallback(async (signal?: AbortSignal) => {
    try {
      setSysLoading(true);
      const res = await fetch("/api/dashboard/metrics", { cache: "no-store", signal });
      if (!res.ok) throw new Error("Failed to fetch /api/dashboard/metrics");
      const json: SystemMetricsResp = await res.json();
      setSysDaily(json.daily?.pointsEarned ?? 0);
      setSysHourly(Array.isArray(json.hourly) ? json.hourly : []);
      setSysError(null);
    } catch (e: any) {
      setSysError(e?.message || "Failed to fetch metrics");
    } finally {
      setSysLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadSystemMetrics(ac.signal);
    const t = setInterval(() => loadSystemMetrics(), SYS_REFRESH_MS);
    return () => {
      ac.abort();
      clearInterval(t);
    };
  }, [loadSystemMetrics]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const nodeStatus = connected ? "● Connected" : "○ Disconnected";

  // เตรียมข้อมูลสำหรับกราฟ System Hourly (UTC)
  const sysRows = useMemo(
    () =>
      sysHourly.map((r) => ({
        hour: new Date(r.hourUtc).getUTCHours().toString().padStart(2, "0") + ":00",
        points: r.pointsEarned,
      })),
    [sysHourly]
  );
  const sysPeak = useMemo(
    () => sysRows.reduce((m, r) => Math.max(m, r.points), 0),
    [sysRows]
  );

  // Slice รายการ tx ตามจำนวนที่โชว์
  const txPage = useMemo(() => txData.slice(0, txVisible), [txData, txVisible]);
  const canLoadMore = txData.length > txVisible;

  const handleLoadMoreTx = () => {
    setTxVisible((prev) => Math.min(prev + TX_PAGE_SIZE, txData.length));
  };

  return (
    <div className="min-h-screen text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solink Dashboard</h1>
            <p className="text-slate-400">{loading ? "Loading data…" : "Wired to API routes."}</p>
            {err && <p className="text-rose-400 text-sm mt-1">Error: {err}</p>}
          </div>

          {/* Wallet + Start Sharing */}
          <div className="wa-equal flex items-center gap-3">
            <WalletMultiButton />
            <Button variant="secondary" className="rounded-2xl px-5 h-12">
              Start Sharing Bandwidth <Link2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI
            title="Points Today"
            value={summary ? summary.pointsToday.toLocaleString() : "—"}
            sub={`from daily cap ${summary ? (2000).toLocaleString() : "—"}`}
            icon={<Award className="h-5 w-5" />}
            loading={loading}
          />
          <KPI
            title="Total Points"
            value={summary ? summary.totalPoints.toLocaleString() : "—"}
            sub={summary ? `≈ ${summary.slk.toLocaleString()} SLK` : "—"}
            icon={<TrendingUp className="h-5 w-5" />}
            loading={loading}
          />
          <KPI
            title="Uptime Today"
            value={summary ? `${summary.uptimeHours} h` : "—"}
            sub={summary ? `Goal: ≥ ${summary.goalHours} h` : "—"}
            icon={<Activity className="h-5 w-5" />}
            loading={loading}
          />
          <KPI
            title="Average Bandwidth"
            value={summary ? `${summary.avgBandwidthMbps} Mbps` : "—"}
            sub="Last 15 minutes"
            icon={<Cloud className="h-5 w-5" />}
            loading={loading}
          />
        </div>

        {/* Charts + Quality Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* User Hourly chart */}
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Gauge className="h-4 w-4" /> Hourly Points (User)
                </h3>
                <span className="text-xs text-slate-400">{tz}</span>
              </div>
              <HourlyPoints data={hourly} units={prefs.units} tz={tz} />
            </CardContent>
          </Card>

          {/* Quality Factor & Trust */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">Quality Factor &amp; Trust Score</h3>
              <Meter label="Quality Factor" value={summary?.qf ?? 0} color="from-cyan-400 to-indigo-500" />
              <div className="h-3" />
              <Meter label="Trust Score" value={summary?.trust ?? 0} color="from-emerald-400 to-cyan-400" />
              <div className="text-sm text-slate-400 mt-2">
                Note: QF considers p50 latency, jitter, and session stability.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System (GLOBAL) Hourly */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-3">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart4 className="h-4 w-4" /> System Hourly (UTC)
                </h3>
                <div className="text-xs text-slate-400">
                  Today Total: {sysLoading ? "—" : sysDaily.toLocaleString()} pts
                </div>
              </div>

              <div className="w-full h-72 rounded-2xl border border-slate-800 bg-slate-950/40 p-2">
                {sysLoading ? (
                  <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>
                ) : sysError ? (
                  <div className="text-rose-400">{sysError}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sysRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sysG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopOpacity={0.35} />
                          <stop offset="95%" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15,23,42,0.96)",
                          border: "1px solid rgba(148,163,184,0.5)",
                          borderRadius: 12,
                          padding: "8px 10px",
                        }}
                        labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
                        itemStyle={{ color: "#22d3ee", fontSize: 12 }}
                        formatter={(v: number) => [`Points : ${v.toLocaleString()} pts`, ""]}
                        labelFormatter={(l: any) => `UTC ${l}`}
                      />
                      <ReferenceLine y={0} />
                      <Area
                        type="monotone"
                        dataKey="points"
                        stroke="currentColor"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#sysG)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">Peak hour: {sysPeak.toLocaleString()} pts</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <RangeRadios value={range} onChange={setRange} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">TZ:</span>
            <span className="text-xs text-slate-300">{tz}</span>
          </div>
        </div>

        {/* Invite & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold">Invite &amp; Earn</h3>
              <p className="text-slate-400 mb-4">
                Share your referral link and earn bonus points when friends join.
              </p>

              <label htmlFor="ref-link" className="text-sm text-slate-400">
                Your referral link
              </label>
              <div className="mt-2 flex flex-col sm:flex-row gap-2">
                <input
                  id="ref-link"
                  value={refLink}
                  readOnly
                  placeholder="https://solink.network/r/..."
                  title="Your referral link"
                  aria-label="Your referral link"
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200"
                />
                <div className="flex gap-2">
                  <Button onClick={copy} className="rounded-xl px-4" title="Copy referral link">
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="secondary" className="rounded-xl" title="Share referral link">
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">System Status</h3>
              <StatusItem label="Node" value={nodeStatus} positive={connected} />
              <StatusItem label="Region" value={summary?.region ?? "—"} />
              <StatusItem label="IP Address" value={summary?.ip ?? "—"} />
              <StatusItem label="Client Version" value={summary?.version ?? "—"} />
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions (with Load More) */}
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Recent Transactions</h3>
              {!loading && (
                <span className="text-xs text-slate-500">
                  Showing {txPage.length.toLocaleString()} of {txData.length.toLocaleString()} events
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="py-2 pr-4">Time</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Amount</th>
                    <th className="py-2 pr-4">Note</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <tr key={`skeleton-${i}`} className="border-t border-slate-800">
                          <td className="py-2 pr-4 text-slate-700">loading…</td>
                          <td className="py-2 pr-4 text-slate-700">—</td>
                          <td className="py-2 pr-4 text-slate-700">—</td>
                          <td className="py-2 pr-4 text-slate-700">—</td>
                        </tr>
                      ))
                    : txPage.map((r, i) => (
                        <tr key={i} className="border-t border-slate-800">
                          <td className="py-2 pr-4 whitespace-nowrap">{r.ts}</td>
                          <td className="py-2 pr-4">{r.type}</td>
                          <td className="py-2 pr-4 font-semibold">{r.amount}</td>
                          <td className="py-2 pr-4 text-slate-400">{r.note}</td>
                        </tr>
                      ))}
                </tbody>
                {!loading && canLoadMore && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <Button
                            onClick={handleLoadMoreTx}
                            className="rounded-xl px-4"
                            variant="outline"
                          >
                            Load more
                          </Button>
                          <span className="text-xs text-slate-500">
                            Loaded {txPage.length.toLocaleString()} of{" "}
                            {txData.length.toLocaleString()} events
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </CardContent>
        </Card>

        <footer className="text-xs text-slate-500 mt-8">
          © {new Date().getFullYear()} Solink • Demo build — data via API routes.
        </footer>
      </div>
    </div>
  );
}

/* --------------------------- small UI helpers --------------------------- */
function KPI({
  title,
  value,
  sub,
  icon,
  loading,
}: {
  title: string;
  value: string;
  sub?: string;
  icon?: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-slate-400 text-xs uppercase tracking-wide">{title}</div>
            <div className="text-2xl font-bold mt-1">{loading ? "—" : value}</div>
            {sub && <div className="text-slate-400 text-xs mt-1">{loading ? "—" : sub}</div>}
          </div>
          <div className="opacity-70">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function widthClass(value: number) {
  let v = Math.max(0, Math.min(100, value ?? 0));
  v = Math.round(v / 5) * 5;
  return `mw-${v}`;
}

function Meter({ label, value, color }: { label: string; value: number; color: string }) {
  const v = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-400">{v}%</span>
      </div>
      <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
        <div className={`h-full bg-gradient-to-r ${color} ${widthClass(v)}`} />
      </div>
    </div>
  );
}

function StatusItem({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800 last:border-none">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`text-sm ${positive ? "text-emerald-400" : "text-slate-300"}`}>{value}</span>
    </div>
  );
}

function RangeRadios({
  value,
  onChange,
}: {
  value: DashboardRange;
  onChange: (v: DashboardRange) => void;
}) {
  const opts: Array<{ v: DashboardRange; label: string }> = [
    { v: "today", label: "Today" },
    { v: "7d", label: "7d" },
    { v: "30d", label: "30d" },
  ];

  return (
    <fieldset className="flex items-center gap-2">
      <legend id="range-legend" className="text-xs text-slate-400 mr-1">
        Range:
      </legend>
      <div className="flex items-center gap-2" aria-labelledby="range-legend">
        {opts.map((o) => {
          const id = `range-${o.v}`;
          return (
            <div key={o.v} className="inline-block">
              <input
                id={id}
                type="radio"
                name="range"
                value={o.v}
                checked={value === o.v}
                onChange={() => onChange(o.v)}
                className="sr-only peer"
                aria-label={o.label}
              />
              <label
                htmlFor={id}
                className={[
                  "px-3 py-1 rounded-xl text-xs border transition select-none cursor-pointer",
                  "bg-slate-900/60 border-slate-700 hover:bg-slate-800 text-slate-300",
                  "peer-checked:bg-sky-500/20 peer-checked:border-sky-500 peer-checked:text-sky-300",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
                ].join(" ")}
                title={o.label}
              >
                {o.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

/* helper: แปลง Uint8Array -> base64 สำหรับ signature */
function u8ToBase64(arr: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < arr.length; i++) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary);
}

function DashboardGlobalStyles() {
  return (
    <style jsx global>{`
      /* Progress meter width steps */
      .mw-0 { width: 0% } .mw-5 { width: 5% } .mw-10 { width: 10% } .mw-15 { width: 15% }
      .mw-20 { width: 20% } .mw-25 { width: 25% } .mw-30 { width: 30% } .mw-35 { width: 35% }
      .mw-40 { width: 40% } .mw-45 { width: 45% } .mw-50 { width: 50% } .mw-55 { width: 55% }
      .mw-60 { width: 60% } .mw-65 { width: 65% } .mw-70 { width: 70% } .mw-75 { width: 75% }
      .mw-80 { width: 80% } .mw-85 { width: 85% } .mw-90 { width: 90% } .mw-95 { width: 95% }
      .mw-100 { width: 100% }

      /* ทำให้ WalletMultiButton เท่าปุ่ม Start Sharing เมื่ออยู่ใน .wa-equal */
      .wa-equal .wallet-adapter-button {
        height: 3rem;               /* h-12 */
        padding: 0 1.25rem;         /* px-5 */
        border-radius: 1rem;        /* rounded-2xl */
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;                /* icon spacing */
        font-size: 0.875rem;        /* text-sm */
        line-height: 1;             /* avoid vertical jitter */
      }
      .wa-equal .wallet-adapter-button .wallet-adapter-button-start-icon,
      .wa-equal .wallet-adapter-button .wallet-adapter-button-end-icon {
        width: 1rem; height: 1rem;  /* h-4 w-4 */
      }
    `}</style>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Suspense fallback={<div className="p-6 text-slate-400">Loading…</div>}>
        <DashboardInner />
      </Suspense>
      <DashboardGlobalStyles />
    </>
  );
}
