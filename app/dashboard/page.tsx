"use client";

import type {
  DashboardRange,
  DashboardRealtime,
  DashboardSummary,
  HourlyPoint,
  Tx,
} from "@/types/dashboard";

import NextDynamic from "next/dynamic";
const WalletMultiButton = NextDynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

import React, { Suspense, useEffect, useState, useCallback, useMemo } from "react";
export const dynamic = "force-dynamic";
import { formatBandwidth } from "@/lib/format";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  Link2,
  Gauge,
  Award,
  Activity,
  Cloud,
  TrendingUp,
  BarChart4,
  LineChart as LineIcon,
} from "lucide-react";

import { fetchHourly, fetchRealtime, fetchTransactions } from "../../lib/data/dashboard";


import HourlyPoints from "../../components/charts/HourlyPoints";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrefs } from "../../lib/prefs-client";

/* Recharts */
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  BarChart,
  Bar,
  LineChart,
  Line,
} from "recharts";

/* ---------------------------------- types ----------------------------------- */
type SystemHourRow = { hourUtc: string; pointsEarned: number };

type SystemMetricsResp = {
  ok: boolean;
  range: DashboardRange;
  startUtc: string;
  endUtc: string;
  totalPoints: number;
  hourly: SystemHourRow[];
};

type SystemDailyRow = { dayUtc: string; label: string; pointsEarned: number };
type SystemDailyResp = {
  ok: boolean;
  range: DashboardRange;
  startUtc: string;
  endUtc: string;
  totalPoints: number;
  days: SystemDailyRow[];
};

type StreakData = {
  current: number;
  best: number;
};

type UserDailyPoint = {
  dayUtc: string;
  label: string; // YYYY-MM-DD
  points: number;
};

const TX_PAGE_SIZE = 20;

/* -------------------------------- helpers ----------------------------------- */

async function fetchDashboardSummaryClient(
  range: DashboardRange,
  signal?: AbortSignal
): Promise<DashboardSummary | null> {
  try {
    const res = await fetch(`/api/dashboard/summary?range=${range}`, {
      method: "GET",
      cache: "no-store",
      signal,
      credentials: "include",
    });

    if (!res.ok) {
      console.error("Failed to fetch /api/dashboard/summary:", res.status);
      return null;
    }

    const data = await res.json();

    if (data.ok && data.summary) {
      return data.summary as DashboardSummary;
    }

    // fallback (legacy response)
    return {
      pointsToday: data.pointsToday ?? 0,
      totalPoints: data.totalPoints ?? 0,
      slk: data.slk ?? 0,
      uptimeHours: data.uptimeHours ?? 0,
      goalHours: data.goalHours ?? 8,
      avgBandwidthMbps: data.avgBandwidthMbps ?? 0,
      qf: data.qf ?? 0,
      trust: data.trust ?? 0,
      region: data.region ?? null,
      ip: data.ip ?? null,
      version: data.version ?? null,
    } as DashboardSummary;
  } catch (e) {
    console.error("summary client error:", e);
    return null;
  }
}

/* ---------------------------------- page ----------------------------------- */

function DashboardInner() {
  // Summary + user hourly + tx
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[]>([]);
  const [txData, setTxData] = useState<Tx[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // ✅ Realtime (Points Today - UTC day)
  const [realtime, setRealtime] = useState<DashboardRealtime | null>(null);
  const REALTIME_REFRESH_MS = 5_000;

  const [range, setRange] = useState<DashboardRange>("today");
  const { prefs } = usePrefs();
  const tz = "UTC";

  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();
  const [refLink, setRefLink] = useState("");
  const [copied, setCopied] = useState(false);

  // ---- Sharing state (Start / Stop) ----
  const [sharingActive, setSharingActive] = useState(false);
  const [sharingLoading, setSharingLoading] = useState(false);
  const [sharingError, setSharingError] = useState<string | null>(null);

  // ---- System Metrics (GLOBAL hourly) ----
  const [sysLoading, setSysLoading] = useState(true);
  const [sysError, setSysError] = useState<string | null>(null);
  const [sysDailyTotalFromHourly, setSysDailyTotalFromHourly] = useState<number>(0);
  const [sysHourly, setSysHourly] = useState<SystemHourRow[]>([]);

  // ---- System Daily (GLOBAL) ----
  const [sysDailyLoading, setSysDailyLoading] = useState(true);
  const [sysDailyError, setSysDailyError] = useState<string | null>(null);
  const [sysDailySeries, setSysDailySeries] = useState<Array<{ label: string; points: number }>>(
    []
  );
  const [sysDailyTotal, setSysDailyTotal] = useState<number>(0);

  // ---- User Daily (via /api/dashboard/user-daily) ----
  const [userDaily, setUserDaily] = useState<UserDailyPoint[]>([]);
  const [userDailyLoading, setUserDailyLoading] = useState(false);
  const [userDailyError, setUserDailyError] = useState<string | null>(null);
  const [dailyRange, setDailyRange] = useState<DashboardRange>("7d");

  // ---- Streak (via /api/dashboard/streak) ----
  const [streak, setStreak] = useState<StreakData | null>(null);
  const [streakError, setStreakError] = useState<string | null>(null);

  // Recent tx pagination
  const [txVisible, setTxVisible] = useState<number>(TX_PAGE_SIZE);

  // Node latency monitoring
  const [latency, setLatency] = useState<number | null>(null);
  const [latencySeries, setLatencySeries] = useState<Array<{ ts: string; latencyMs: number }>>([]);
  const [pingConnected, setPingConnected] = useState<boolean>(false);
  const [pingRegion, setPingRegion] = useState<string | null>(null);
  const [pingIp, setPingIp] = useState<string | null>(null);
  const [pingVersion, setPingVersion] = useState<string | null>(null);

  // refetch interval (ms) สำหรับ metrics ระบบ
  const SYS_REFRESH_MS = 30_000;

  // ---- Convert SLK module state ----
  const [convertPts, setConvertPts] = useState<string>("");
  const [convertLoading, setConvertLoading] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);

  const pointsNum = Number(convertPts || "0");
  const slkRate = 1000; // 1000 pts = 1 SLK
  const slkEstimated =
    Number.isFinite(pointsNum) && pointsNum > 0 ? (pointsNum / slkRate).toFixed(2) : "0.00";

  /* Referral link (local only สำหรับตอนนี้) */
  useEffect(() => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://solink.network";
    const code = address ? address.slice(0, 8) : localStorage.getItem("solink_ref_code") || "";
    const finalCode =
      code ||
      (() => {
        const c = Math.random().toString(36).slice(2, 10);
        try {
          localStorage.setItem("solink_ref_code", c);
        } catch {}
        return c;
      })();
    setRefLink(`${origin.replace(/\/$/, "")}/r/${encodeURIComponent(finalCode)}`);
  }, [address]);

  /* sync wallet -> prefs API + login ด้วย wallet address เฉย ๆ */
  useEffect(() => {
    if (!address || !connected) return;

    try {
      localStorage.setItem("solink_wallet", address);
      document.cookie = `solink_wallet=${address}; Path=/; SameSite=Lax; Max-Age=2592000`;
    } catch {}

    // ยิง /api/prefs (ของเดิม)
    fetch("/api/prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wallet: address }),
      credentials: "include",
    }).catch(() => {});

    // 🔐 ยิง /api/auth/login เพื่อให้ server เซ็ต cookie solink_auth
    (async () => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wallet: address }),
          credentials: "include",
        });
        if (!res.ok) {
          console.error("auth/login failed:", await res.text());
        }
      } catch (e) {
        console.error("auth/login error:", e);
      }
    })();
  }, [address, connected]);

  /* ตรวจสอบสถานะ login จาก /api/auth/me (debug / ใช้ต่อยอดได้) */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store", credentials: "include" });
        const json = await res.json();
        console.log("auth status:", json);
      } catch (e) {
        console.error("auth/me failed:", e);
      }
    })();
  }, []);

  /* ให้ dailyRange ตาม range เสมอ (ใช้ range เดียวกับ dashboard) */
  useEffect(() => {
    setDailyRange(range);
  }, [range]);

  /* load summary + user hourly + tx */
  const refresh = useCallback(() => {
    const ac = new AbortController();
    (async () => {
      try {
        setLoading(true);
        const [s, h, t] = await Promise.all([
          fetchDashboardSummaryClient(range, ac.signal),
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

  // ✅ realtime polling (independent from range)
  const refreshRealtime = useCallback(async (signal?: AbortSignal) => {
    try {
      const data = await fetchRealtime(signal);
      if (data && data.ok) setRealtime(data);
      else setRealtime(null);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    refreshRealtime(ac.signal);
    const t = setInterval(() => refreshRealtime(), REALTIME_REFRESH_MS);
    return () => {
      ac.abort();
      clearInterval(t);
    };
  }, [refreshRealtime]);

  /* reset tx visible เมื่อชุด tx เปลี่ยน (เปลี่ยน range) */
  useEffect(() => {
    setTxVisible(TX_PAGE_SIZE);
  }, [txData]);

  /* load System Metrics (GLOBAL Hourly) จาก /api/dashboard/metrics + auto refresh */
  const loadSystemMetrics = useCallback(async (r: DashboardRange, signal?: AbortSignal) => {
    try {
      setSysLoading(true);
      const res = await fetch(`/api/dashboard/metrics?range=${r}`, {
        cache: "no-store",
        signal,
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch /api/dashboard/metrics");
      const json: SystemMetricsResp = await res.json();
      setSysDailyTotalFromHourly(json.totalPoints ?? 0);
      setSysHourly(Array.isArray(json.hourly) ? json.hourly : []);
      setSysError(null);
    } catch (e: any) {
      console.error("metrics error:", e);
      setSysError(e?.message || "Failed to fetch metrics");
    } finally {
      setSysLoading(false);
    }
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    loadSystemMetrics(range, ac.signal);
    const t = setInterval(() => loadSystemMetrics(range), SYS_REFRESH_MS);
    return () => {
      ac.abort();
      clearInterval(t);
    };
  }, [loadSystemMetrics, range]);

  /* System Daily (GLOBAL) จาก /api/dashboard/system-daily */
const loadSystemDaily = useCallback(async (r: DashboardRange, signal?: AbortSignal) => {
  try {
    setSysDailyLoading(true);
    const res = await fetch(`/api/dashboard/system-daily?range=${r}`, {
      cache: "no-store",
      signal,
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch /api/dashboard/system-daily");

    const json: any = await res.json();

    // ✅ รองรับหลาย format: days (เก่า) / series (ใหม่) / daily (compat)
    const src =
      (Array.isArray(json?.days) && json.days) ||
      (Array.isArray(json?.series) && json.series) ||
      (Array.isArray(json?.daily) && json.daily) ||
      [];

    const series = src
      .map((d: any) => {
        // days format (เก่า): { label, pointsEarned }
        if (typeof d?.label === "string") {
          const pts =
            typeof d?.pointsEarned === "number" ? d.pointsEarned : Number(d?.pointsEarned ?? 0);
          return { label: d.label, points: Number.isFinite(pts) ? pts : 0 };
        }

        // series/daily format (ใหม่): { dayUtc, points } หรือ { dayUtc, pointsEarned }
        const dayUtc = typeof d?.dayUtc === "string" ? d.dayUtc : null;
        if (!dayUtc) return null;

        const ptsRaw =
          d?.points != null ? d.points : d?.pointsEarned != null ? d.pointsEarned : 0;

        const pts = typeof ptsRaw === "number" ? ptsRaw : Number(ptsRaw);
        const label = dayUtc.slice(0, 10); // YYYY-MM-DD

        return { label, points: Number.isFinite(pts) ? pts : 0 };
      })
      .filter(Boolean) as Array<{ label: string; points: number }>;

    // เรียงวันกันหลุด (กัน API/DB ส่งไม่เรียง)
    series.sort((a, b) => a.label.localeCompare(b.label));

    // total
    const total = series.reduce((s, x) => s + (x.points ?? 0), 0);

    setSysDailySeries(series);
    setSysDailyTotal(total);
    setSysDailyError(null);
  } catch (e: any) {
    console.error("system-daily error:", e);
    setSysDailyError(e?.message || "Failed to fetch system daily stats");
    setSysDailySeries([]);
    setSysDailyTotal(0);
  } finally {
    setSysDailyLoading(false);
  }
}, []);


  // โหลด System Daily เมื่อ range เปลี่ยน
  useEffect(() => {
    const ac = new AbortController();
    loadSystemDaily(range, ac.signal);
    return () => ac.abort();
  }, [loadSystemDaily, range]);

  /* 3.1 โหลด Streak จาก /api/dashboard/streak */
  useEffect(() => {
    let cancelled = false;

    async function loadStreak() {
      try {
        setStreakError(null);
        const res = await fetch("/api/dashboard/streak", { credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error || "Failed to load streak");
        }
        if (!cancelled) {
          setStreak({
            current: json.current ?? 0,
            best: json.best ?? 0,
          });
        }
      } catch (e: any) {
        console.error("streak fetch error:", e);
        if (!cancelled) {
          setStreak(null);
          setStreakError(e?.message || "Failed to load streak");
        }
      }
    }

    loadStreak();

    return () => {
      cancelled = true;
    };
  }, []);

  /* 3.3 User Daily Points จาก /api/dashboard/user-daily?range=... */
  useEffect(() => {
    let cancelled = false;

    async function loadUserDailyRange() {
      try {
        setUserDailyLoading(true);
        setUserDailyError(null);
        const res = await fetch(`/api/dashboard/user-daily?range=${dailyRange}`, {
          credentials: "include",
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error || "Failed to load user daily points");
        }
        if (!cancelled) {
          const arr =
  (Array.isArray(json?.items) && json.items) ||
  (Array.isArray(json?.series) && json.series) ||
  (Array.isArray(json?.daily) && json.daily) ||
  [];

setUserDaily(arr);

        }
      } catch (e: any) {
        console.error("user-daily fetch error:", e);
        if (!cancelled) {
          setUserDaily([]);
          setUserDailyError(e?.message || "Failed to load");
        }
      } finally {
        if (!cancelled) setUserDailyLoading(false);
      }
    }

    loadUserDailyRange();

    return () => {
      cancelled = true;
    };
  }, [dailyRange]);

  // Node ping latency monitor (real-time)
  useEffect(() => {
    const pingOnce = async () => {
      const t0 = performance.now();
      try {
        const r = await fetch("/api/dashboard/ping", { cache: "no-store" });
        const t1 = performance.now();

        // fallback: ถ้า API ไม่ส่ง latencyMs (หรือ null) ให้ใช้ RTT ของ fetch แทน
        const fallbackRtt = Math.max(1, Math.round(t1 - t0));
        const j = (await r.json().catch(() => null)) as any;

        if (j && typeof j === "object") {
          setPingConnected(!!j.connected && !!j.ok);
          setPingRegion(j.region ?? null);
          setPingIp(j.ip ?? null);
          setPingVersion(j.version ?? null);

          const apiLatency = typeof j.latencyMs === "number" ? j.latencyMs : null;
          const ms = apiLatency ?? fallbackRtt;

          setLatency(ms);

          const s = Array.isArray(j.series) ? j.series : [];
          const cooked = s
            .map((p: any) => {
              const ts = typeof p?.ts === "string" ? p.ts : null;
              const lm = typeof p?.latencyMs === "number" ? p.latencyMs : null;
              if (!ts || lm == null) return null;
              return { ts, latencyMs: lm };
            })
            .filter(Boolean) as Array<{ ts: string; latencyMs: number }>;

          if (cooked.length) {
            setLatencySeries(cooked.slice(-60));
          } else {
            setLatencySeries((prev) => {
              const next = [...prev, { ts: new Date().toISOString(), latencyMs: ms }];
              return next.slice(-60);
            });
          }
        } else {
          setLatency(fallbackRtt);
          setLatencySeries((prev) => {
            const next = [...prev, { ts: new Date().toISOString(), latencyMs: fallbackRtt }];
            return next.slice(-60);
          });
        }
      } catch {
        // ignore
      }
    };

    pingOnce();
    const id = setInterval(pingOnce, 15_000);
    return () => clearInterval(id);
  }, []);

  /* ------------------------------------------------------------------
     AUTO HEARTBEAT WORKER  
     ยิง /api/sharing/heartbeat ทุก 15 วินาที เมื่อ sharingActive = true
  ------------------------------------------------------------------ */
  useEffect(() => {
    if (!connected || !address) return;

    let interval: NodeJS.Timeout | null = null;

    const sendHeartbeat = async () => {
      try {
        const r = await fetch("/api/sharing/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          credentials: "include",
          body: JSON.stringify({
            uptimeSeconds: 65,
            downloadMbps: summary?.avgBandwidthMbps ? Number(summary.avgBandwidthMbps) : 12.3,
            uploadMbps: null,
            latencyMs: latency ?? null,
          }),
        });

        const j = (await r.json().catch(() => null)) as any;

        if (j && typeof j === "object") {
          // ถ้า server ให้แต้มจริง หรือบอกว่า active=false (เพื่อ sync UI)
          if (typeof j.awarded === "number" && j.awarded > 0) {
            refreshRealtime();
            refresh(); // summary + hourly + tx
            loadSystemMetrics(range);
            loadSystemDaily(range);
          } else if (j.active === false) {
            refresh();
          }
        }
      } catch (e) {
        console.error("Heartbeat error:", e);
      }
    };

    if (sharingActive) {
      console.log("🔥 Auto-heartbeat started");
      interval = setInterval(sendHeartbeat, 15_000);
      sendHeartbeat();
    }

    return () => {
      if (interval) clearInterval(interval);
      console.log("🛑 Auto-heartbeat stopped");
    };
  }, [
    sharingActive,
    connected,
    address,
    latency,
    summary?.avgBandwidthMbps,
    refresh,
    refreshRealtime,
    loadSystemMetrics,
    loadSystemDaily,
    range,
  ]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(refLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  // ✅ Points Today display: realtime first, fallback summary
  const pointsTodayDisplay =
    realtime?.ok ? realtime.pointsToday : summary ? summary.pointsToday : null;

  // เตรียมข้อมูลสำหรับกราฟ System Hourly (UTC)
  const sysRows = useMemo(
    () =>
      sysHourly.map((r) => {
        const d = new Date(r.hourUtc);
        const h = d.getUTCHours().toString().padStart(2, "0");
        const md = `${(d.getUTCMonth() + 1).toString().padStart(2, "0")}/${d
          .getUTCDate()
          .toString()
          .padStart(2, "0")}`;
        const label = range === "today" ? `${h}:00` : `${md} ${h}:00`;
        return {
          label,
          points: r.pointsEarned,
        };
      }),
    [sysHourly, range]
  );

  const sysPeak = useMemo(() => sysRows.reduce((m, r) => Math.max(m, r.points), 0), [sysRows]);

  const userDailyTotal = useMemo(() => userDaily.reduce((sum, d) => sum + d.points, 0), [userDaily]);

  // latency chart data
  const latencyChartData = useMemo(
    () => latencySeries.map((p) => ({ ts: p.ts, ms: Math.round(p.latencyMs) })),
    [latencySeries]
  );

  // Slice รายการ tx ตามจำนวนที่โชว์
  const txPage = useMemo(() => txData.slice(0, txVisible), [txData, txVisible]);
  const canLoadMore = txData.length > txVisible;

  const handleLoadMoreTx = () => {
    setTxVisible((prev) => Math.min(prev + TX_PAGE_SIZE, txData.length));
  };

  const sysRangeLabel =
    range === "today" ? "Today total" : range === "7d" ? "Last 7 days total" : "Last 30 days total";

  const sysDailyLabel = range === "today" ? "Today" : range === "7d" ? "Last 7 days" : "Last 30 days";

  const userDailyLabel =
    dailyRange === "today" ? "Today" : dailyRange === "7d" ? "Last 7 days" : "Last 30 days";

  // Uptime meter V2 value (%)
  const uptimePct =
    summary && summary.goalHours > 0
      ? Math.min(100, Math.round((summary.uptimeHours / summary.goalHours) * 100))
      : 0;

  // -------- Sharing: load initial status --------
  useEffect(() => {
    if (!connected || !address) {
      setSharingActive(false);
      setSharingError(null);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/sharing/status", { cache: "no-store", credentials: "include" });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          throw new Error(json?.error || "Failed to load sharing status");
        }
        if (!cancelled) {
          setSharingActive(!!json.active);
          setSharingError(null);
        }
      } catch (e: any) {
        console.error("sharing status error:", e);
        if (!cancelled) {
          setSharingActive(false);
          setSharingError(e?.message || "Failed to load sharing status");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connected, address]);

  // -------- Sharing: toggle handler (/api/sharing/toggle) --------
  const handleToggleSharing = async () => {
    if (!connected || !address) {
      setSharingError("Please connect your wallet first.");
      return;
    }

    const next = !sharingActive;

    try {
      setSharingLoading(true);
      setSharingError(null);

      const res = await fetch("/api/sharing/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        credentials: "include",
        body: JSON.stringify({
          address,
          active: next,
        }),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `HTTP ${res.status} while toggling sharing`);
      }

      setSharingActive(!!json.active);
    } catch (e: any) {
      console.error("sharing toggle error:", e);
      setSharingError(e?.message || "Failed to toggle sharing");
    } finally {
      setSharingLoading(false);
    }
  };

  // -------- Convert handler (เรียก API /api/points/convert) --------
  const handleConvert = async () => {
    setConvertError(null);
    setConvertSuccess(null);

    if (!connected || !address) {
      setConvertError("Please connect your wallet first.");
      return;
    }

    if (!Number.isFinite(pointsNum) || pointsNum <= 0) {
      setConvertError("Please enter points greater than zero.");
      return;
    }

    if (!summary || summary.totalPoints <= 0) {
      setConvertError("You have no points to convert yet.");
      return;
    }

    if (pointsNum > summary.totalPoints) {
      setConvertError("You cannot convert more points than your current balance.");
      return;
    }

    try {
      setConvertLoading(true);

      const res = await fetch("/api/points/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ wallet: address, points: pointsNum }),
      });

      const json = await res.json();

      if (!res.ok || !json.ok) {
        if (res.status === 403) {
          setConvertError("Conversion is currently disabled.");
        } else {
          setConvertError(json.error || "Conversion failed.");
        }
        return;
      }

      setConvertSuccess(`Converted ${json.pointsSpent.toLocaleString()} pts → ${json.slkReceived} SLK`);

      refresh();
      setConvertPts("");
    } catch (e: any) {
      console.error("convert error:", e);
      setConvertError(e?.message || "Conversion error.");
    } finally {
      setConvertLoading(false);
    }
  };

  const canConvert =
    connected &&
    !!address &&
    !!summary &&
    summary.totalPoints > 0 &&
    Number.isFinite(pointsNum) &&
    pointsNum > 0;

  return (
    <div className="min-h-screen text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Solink Dashboard</h1>
            <p className="text-slate-400">{loading ? "Loading data…" : "Wired to API routes."}</p>
            {err && <p className="text-rose-400 text-sm mt-1">Error: {err}</p>}

            <p className="text-xs text-slate-400 mt-1">
              Sharing:{" "}
              {!connected ? (
                <span className="text-slate-400">Connect your wallet to start</span>
              ) : (
                <span className={sharingActive ? "text-emerald-400" : "text-amber-400"}>
                  {sharingActive ? "Active" : "Paused"}
                </span>
              )}
            </p>
            {sharingError && <p className="text-[11px] text-rose-400 mt-1">Sharing error: {sharingError}</p>}
          </div>

          {/* Wallet + Start Sharing */}
          <div className="wa-equal flex items-center gap-3">
            <WalletMultiButton />
            <Button
              variant="secondary"
              className="rounded-2xl px-5 h-12"
              onClick={handleToggleSharing}
              disabled={sharingLoading || !connected}
              title={
                !connected
                  ? "Connect your wallet first"
                  : sharingActive
                  ? "Stop sharing bandwidth"
                  : "Start sharing bandwidth"
              }
            >
              {sharingLoading ? "Updating…" : sharingActive ? "Stop Sharing" : "Start Sharing Bandwidth"}{" "}
              <Link2 className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPI
            title="Points Today"
            value={pointsTodayDisplay != null ? pointsTodayDisplay.toLocaleString() : "—"}
            sub={
              realtime?.ok
                ? `live (UTC): ${(realtime.livePoints ?? 0).toLocaleString()}  rolled: ${(realtime.rolledPoints ?? 0).toLocaleString()}`
                : `from daily cap ${summary ? (2000).toLocaleString() : "—"}`
            }
            icon={<Award className="h-5 w-5" />}
            loading={loading && pointsTodayDisplay == null}
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
  value={summary ? `${Number(summary.uptimeHours).toFixed(2)} h` : "—"}
  sub={summary ? `Goal: ≥ ${Number(summary.goalHours).toFixed(0)} h` : "—"}
  icon={<Activity className="h-5 w-5" />}
  loading={loading}
/>

          <KPI
  title="Average Bandwidth"
  value={summary ? formatBandwidth(summary.avgBandwidthMbps, prefs.units, 3) : "—"}
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

          {/* Quality Factor, Trust & Uptime meter V2 */}
          <Card>
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold mb-3">Quality &amp; Reliability</h3>
              <Meter label="Quality Factor" value={summary?.qf ?? 0} color="from-cyan-400 to-indigo-500" />
              <div className="h-3" />
              <Meter label="Trust Score" value={summary?.trust ?? 0} color="from-emerald-400 to-cyan-400" />
              <div className="h-3" />
              <Meter label="Uptime Today" value={uptimePct} color="from-sky-400 to-emerald-400" />
              <div className="text-sm text-slate-400 mt-2">Uptime target is computed from your daily goal hours.</div>
            </CardContent>
          </Card>
        </div>

        {/* System Hourly + System Daily (GLOBAL) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* System Hourly */}
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart4 className="h-4 w-4" /> System Hourly (UTC)
                </h3>
                <div className="text-xs text-slate-400">
                  {sysRangeLabel}: {sysLoading ? "—" : sysDailyTotalFromHourly.toLocaleString()} pts
                </div>
              </div>

              <div className="w-full h-72 rounded-2xl border border-slate-800 bg-slate-950/40 p-2">
                {sysLoading ? (
                  <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>
                ) : sysError ? (
                  <div className="text-rose-400">{sysError}</div>
                ) : sysRows.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                    No system activity in this range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sysRows} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="sysG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
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
                      />
                      <ReferenceLine y={0} />
                      <Area
                        type="monotone"
                        dataKey="points"
                        stroke="#22d3ee"
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

          {/* System Daily (GLOBAL) */}
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LineIcon className="h-4 w-4" /> System Daily (GLOBAL)
                </h3>
                <div className="text-xs text-slate-400">
                  {sysDailyLabel}: {sysDailyLoading ? "—" : sysDailyTotal.toLocaleString()} pts
                </div>
              </div>
              <div className="w-full h-64 rounded-2xl border border-slate-800 bg-slate-950/40 p-2">
                {sysDailyLoading ? (
                  <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>
                ) : sysDailyError ? (
                  <div className="text-rose-400 text-sm">{sysDailyError}</div>
                ) : sysDailySeries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                    No daily data for this range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sysDailySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
  cursor={false} // ✅ ปิดแถบเทา/ขาวที่ตามเมาส์
  contentStyle={{
    backgroundColor: "rgba(15,23,42,0.96)",
    border: "1px solid rgba(148,163,184,0.5)",
    borderRadius: 12,
    padding: "8px 10px",
  }}
  labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
  itemStyle={{ color: "#22c55e", fontSize: 12 }}
  formatter={(v: number) => [`${v.toLocaleString()} pts`, "System daily"]}
/>


                      <Bar dataKey="points" radius={[6, 6, 0, 0]} fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 text-xs text-slate-500">Aurora range color: emerald → sky (global daily load).</div>
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

        {/* User Daily + Streak + Convert */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* User Daily graph */}
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LineIcon className="h-4 w-4" /> User Daily Points
                </h3>
                <div className="text-xs text-slate-400">
                  {userDailyLabel}: {userDailyLoading ? "—" : userDailyTotal.toLocaleString()} pts
                </div>
              </div>
              <div className="w-full h-64 rounded-2xl border border-slate-800 bg-slate-950/40 p-2">
                {!connected ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                    Connect your wallet to see your daily points.
                  </div>
                ) : userDailyLoading ? (
                  <div className="flex h-full items-center justify-center text-slate-500">Loading…</div>
                ) : userDailyError ? (
                  <div className="text-rose-400 text-sm">{userDailyError}</div>
                ) : userDaily.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                    No activity yet in this range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={userDaily} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="userDailyG" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(15,23,42,0.96)",
                          border: "1px solid rgba(148,163,184,0.5)",
                          borderRadius: 12,
                          padding: "8px 10px",
                        }}
                        labelStyle={{ color: "#e5e7eb", fontSize: 12 }}
                        itemStyle={{ color: "#6366f1", fontSize: 12 }}
                        formatter={(v: number) => [`${v.toLocaleString()} pts`, "Daily points"]}
                      />
                      <Area type="monotone" dataKey="points" stroke="#6366f1" strokeWidth={2} fill="url(#userDailyG)" fillOpacity={1} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Streak + Convert module */}
          <Card>
            <CardContent className="p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Streak</h3>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-400">Current streak</span>
                  <span className="font-semibold text-emerald-400">
                    {streak ? `${streak.current} day${streak.current === 1 ? "" : "s"}` : "0 days"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">Best streak</span>
                  <span className="font-semibold text-sky-400">
                    {streak ? `${streak.best} day${streak.best === 1 ? "" : "s"}` : "0 days"}
                  </span>
                </div>
                {streakError && <p className="mt-2 text-xs text-rose-400">Error loading streak: {streakError}</p>}
                {!streakError && (
                  <p className="text-xs text-slate-500 mt-2">
                    Streak counts consecutive days where your points are above zero.
                  </p>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3">
                <h3 className="text-lg font-semibold mb-2">Convert to SLK</h3>
                <p className="text-xs text-slate-400 mb-2">
                  Preview and convert your points to SLK. Example rate:{" "}
                  <span className="font-semibold">1000 pts = 1 SLK</span>.
                </p>
                <label htmlFor="convert-pts" className="text-xs text-slate-400 flex items-center justify-between mb-1">
                  <span>Points to convert</span>
                  <span className="text-slate-500">Available: {summary?.totalPoints.toLocaleString() ?? "—"} pts</span>
                </label>
                <input
                  id="convert-pts"
                  inputMode="numeric"
                  value={convertPts}
                  onChange={(e) => setConvertPts(e.target.value)}
                  placeholder="Enter points…"
                  className="w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200 mb-2"
                />
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-slate-400">Estimated SLK</span>
                  <span className="font-semibold text-cyan-400">{slkEstimated} SLK</span>
                </div>
                <Button
                  onClick={handleConvert}
                  disabled={convertLoading || !canConvert}
                  className={"w-full rounded-xl " + (convertLoading ? "opacity-70" : "")}
                  title="Convert points to SLK"
                >
                  {convertLoading ? "Converting…" : "Convert"}
                </Button>
                {convertError && <p className="text-[11px] text-rose-400 mt-1">{convertError}</p>}
                {convertSuccess && <p className="text-[11px] text-emerald-400 mt-1">{convertSuccess}</p>}
                {!convertError && !convertSuccess && (
                  <p className="text-[11px] text-slate-500 mt-1">
                    This will convert your off-chain points to SLK according to the current rate.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invite & Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <h3 className="text-lg font-semibold">Invite &amp; Earn</h3>
              <p className="text-slate-400 mb-4">Share your referral link and earn bonus points when friends join.</p>

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
              <StatusItem label="Node" value={pingConnected ? "Connected" : "Disconnected"} positive={pingConnected} />
              <StatusItem label="Region" value={pingRegion ?? "—"} />
              <StatusItem label="IP Address" value={pingIp ?? "—"} />
              <StatusItem label="Client Version" value={pingVersion ?? "—"} />
              <StatusItem label="Latency" value={latency != null ? `~${Math.round(latency)} ms` : "Measuring…"} />

              {/* Session stability chart (latency history) */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-slate-300">Session stability</span>
                  <span className="text-xs text-slate-500">Lower is better (ping latency)</span>
                </div>
                <div className="w-full h-28 rounded-xl border border-slate-800 bg-slate-950/60 p-1.5">
                  {latencyChartData.length < 2 ? (
                    <div className="flex h-full items-center justify-center text-[11px] text-slate-500">
                      Collecting samples…
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={latencyChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          dataKey="ts"
                          tickFormatter={() => ""}
                          tick={{ fontSize: 8 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis tick={{ fontSize: 8 }} tickLine={false} axisLine={false} width={30} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(15,23,42,0.96)",
                            border: "1px solid rgba(148,163,184,0.5)",
                            borderRadius: 12,
                            padding: "6px 8px",
                          }}
                          labelStyle={{ color: "#e5e7eb", fontSize: 11 }}
                          itemStyle={{ color: "#f97316", fontSize: 11 }}
                          formatter={(v: number) => [`${v.toFixed(0)} ms`, "Latency"]}
                          labelFormatter={(idx: any) => `Sample #${idx}`}
                        />
                        <Line type="monotone" dataKey="ms" stroke="#f97316" strokeWidth={1.8} dot={false} activeDot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
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
                    : txPage.map((r, i) => {
                        const typeDesc = describeTxType(r.type);
                        const note = r.note?.trim();
                        return (
                          <tr key={i} className="border-t border-slate-800">
                            <td className="py-2 pr-4 whitespace-nowrap">{r.ts}</td>
                            <td className="py-2 pr-4">
                              <span className={typeDesc.className}>{typeDesc.label}</span>
                            </td>
                            <td className="py-2 pr-4 font-semibold">{formatAmountPts(r.amount)}</td>
                            <td className="py-2 pr-4 text-slate-400">{note || "—"}</td>
                          </tr>
                        );
                      })}
                </tbody>
                {!loading && canLoadMore && (
                  <tfoot>
                    <tr>
                      <td colSpan={4} className="pt-3">
                        <div className="flex items-center justify-between gap-3">
                          <Button onClick={handleLoadMoreTx} className="rounded-xl px-4" variant="outline">
                            Load more
                          </Button>
                          <span className="text-xs text-slate-500">
                            Loaded {txPage.length.toLocaleString()} of {txData.length.toLocaleString()} events
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

/* --------- Tx type formatting (3A: human-friendly labels & badges) --------- */

type TxTypeDescriptor = {
  label: string;
  className: string;
};

function describeTxType(type: string): TxTypeDescriptor {
  switch (type) {
    case "extension_farm":
      return {
        label: "Extension farming reward",
        className:
          "inline-flex items-center rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2.5 py-0.5 text-xs font-medium",
      };
    case "referral":
      return {
        label: "Referral",
        className:
          "inline-flex items-center rounded-full bg-violet-500/10 text-violet-300 border border-violet-500/30 px-2.5 py-0.5 text-xs font-medium",
      };
    case "referral_bonus":
      return {
        label: "Referral bonus",
        className:
          "inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-medium",
      };
    case "convert_debit":
      return {
        label: "Convert to SLK",
        className:
          "inline-flex items-center rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 text-xs font-medium",
      };
    default:
      return {
        label: type.replace(/_/g, " "),
        className:
          "inline-flex items-center rounded-full bg-slate-700/40 text-slate-200 border border-slate-500/40 px-2.5 py-0.5 text-xs font-medium",
      };
  }
}

function formatAmountPts(v: number): string {
  const n = Number.isFinite(v) ? v : 0;
  return `${n.toLocaleString()} pts`;
}

function RangeRadios({ value, onChange }: { value: DashboardRange; onChange: (v: DashboardRange) => void }) {
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

function DashboardGlobalStyles() {
  return (
    <style jsx global>{`
      /* Progress meter width steps */
      .mw-0 {
        width: 0%;
      }
      .mw-5 {
        width: 5%;
      }
      .mw-10 {
        width: 10%;
      }
      .mw-15 {
        width: 15%;
      }
      .mw-20 {
        width: 20%;
      }
      .mw-25 {
        width: 25%;
      }
      .mw-30 {
        width: 30%;
      }
      .mw-35 {
        width: 35%;
      }
      .mw-40 {
        width: 40%;
      }
      .mw-45 {
        width: 45%;
      }
      .mw-50 {
        width: 50%;
      }
      .mw-55 {
        width: 55%;
      }
      .mw-60 {
        width: 60%;
      }
      .mw-65 {
        width: 65%;
      }
      .mw-70 {
        width: 70%;
      }
      .mw-75 {
        width: 75%;
      }
      .mw-80 {
        width: 80%;
      }
      .mw-85 {
        width: 85%;
      }
      .mw-90 {
        width: 90%;
      }
      .mw-95 {
        width: 95%;
      }
      .mw-100 {
        width: 100%;
      }

      /* ทำให้ WalletMultiButton เท่าปุ่ม Start Sharing เมื่ออยู่ใน .wa-equal */
      .wa-equal .wallet-adapter-button {
        height: 3rem;
        padding: 0 1.25rem;
        border-radius: 1rem;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        line-height: 1;
      }
      .wa-equal .wallet-adapter-button .wallet-adapter-button-start-icon,
      .wa-equal .wallet-adapter-button .wallet-adapter-button-end-icon {
        width: 1rem;
        height: 1rem;
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
