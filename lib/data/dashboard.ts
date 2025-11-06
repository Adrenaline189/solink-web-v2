// lib/data/dashboard.ts
"use client";

import { API_BASE } from "@/lib/env";
import type { DashboardSummary, HourlyPoint, Tx } from "@/types/dashboard";

export type Range = "today" | "7d" | "30d";

/* ---------------------------- demo fallbacks ---------------------------- */
const DEMO_SUMMARY: DashboardSummary = {
  pointsToday: 320,
  totalPoints: 12450,
  slk: 12.45,
  uptimeHours: 6,
  goalHours: 8,
  avgBandwidthMbps: 2.1,
  qf: 82,
  trust: 74,
  region: "SG1",
  ip: "203.0.113.42",
  version: "v0.4.2",
};

const DEMO_HOURLY_TODAY: HourlyPoint[] = [
  { time: "09:00", points: 20, mbps: 0.8 },
  { time: "10:00", points: 65, mbps: 1.1 },
  { time: "11:00", points: 120, mbps: 1.3 },
  { time: "12:00", points: 160, mbps: 1.8 },
  { time: "13:00", points: 200, mbps: 2.0 },
  { time: "14:00", points: 240, mbps: 2.2 },
  { time: "15:00", points: 300, mbps: 2.6 },
];

const DEMO_TX: Tx[] = [
  { ts: "2025-08-15 14:30", type: "Accrual",  amount: "+120 pts",            note: "Uptime slot bonus" },
  { ts: "2025-08-15 13:10", type: "Convert",  amount: "-1,000 pts → +1 SLK", note: "Conversion" },
  { ts: "2025-08-15 12:55", type: "Referral", amount: "+50 pts",             note: "Invite accepted" },
  { ts: "2025-08-15 11:05", type: "Accrual",  amount: "+80 pts",             note: "Usage accrual" },
];

/* -------------------------------- helpers ------------------------------- */
// ต่อ URL ให้รองรับทั้ง relative และ absolute โดยยึด API_BASE เป็นฐาน
function toUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  // ตัดทับซ้อนของ / ให้ออก
  const base = API_BASE.replace(/\/+$/, "");
  const path = pathOrUrl.replace(/^\/+/, "");
  return `${base}/${path}`;
}

async function get<T>(pathOrUrl: string, signal?: AbortSignal): Promise<T> {
  const url = toUrl(pathOrUrl);
  const r = await fetch(url, {
    signal,
    cache: "no-store",
    credentials: "include",
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json() as Promise<T>;
}

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function mdLabel(d: Date) { return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`; }

function fallbackHourly(range: Range): HourlyPoint[] {
  if (range === "today") return DEMO_HOURLY_TODAY;
  const days = range === "7d" ? 7 : 30;
  const now = new Date();
  const out: HourlyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const label = mdLabel(d);
    const idx = days - 1 - i;
    const base = range === "7d" ? 180 + idx * 25 : 120 + idx * 8;
    const wave = range === "7d" ? Math.sin(i) * 20 : Math.cos(i / 3) * 15;
    out.push({
      time: label,
      points: Math.max(0, Math.round(base + wave)),
      mbps: 1.2 + (idx % 10) * 0.03,
    });
  }
  return out;
}

/* ------------------------------- public API ----------------------------- */
export async function fetchDashboardSummary(signal?: AbortSignal): Promise<DashboardSummary> {
  try {
    const json = await get<{ ok: boolean; summary?: DashboardSummary }>(
      "/api/dashboard/summary",
      signal
    );
    if (json?.summary) return json.summary;
    throw new Error("no summary");
  } catch {
    return DEMO_SUMMARY;
  }
}

export async function fetchHourly(range: Range, signal?: AbortSignal): Promise<HourlyPoint[]> {
  try {
    const url = `/api/dashboard/hourly?r=${range}&range=${range}`;
    const json = await get<{ ok: boolean; hourly?: HourlyPoint[] }>(url, signal);
    if (Array.isArray(json?.hourly) && json.hourly.length > 0) return json.hourly;
    throw new Error("empty hourly");
  } catch {
    return fallbackHourly(range);
  }
}

export async function fetchTransactions(range: Range, signal?: AbortSignal): Promise<Tx[]> {
  try {
    const url = `/api/dashboard/transactions?r=${range}&range=${range}`;
    const json = await get<{ ok: boolean; tx?: Tx[] }>(url, signal);
    if (Array.isArray(json?.tx) && json.tx.length > 0) return json.tx;
    throw new Error("empty tx");
  } catch {
    return DEMO_TX;
  }
}
