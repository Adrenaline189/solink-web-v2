// types/dashboard.ts

export type DashboardSummary = {
  pointsToday: number;
  totalPoints: number;
  slk: number;
  uptimeHours: number;
  goalHours: number;
  avgBandwidthMbps: number;
  qf: number; // Quality Factor (0-100)
  trust: number; // Trust Score (0-100)
  region: string | null;
  ip: string | null;
  version: string | null;
};

export type DashboardRealtime = {
  ok: boolean;

  // realtime points for "today" (UTC day)
  pointsToday: number;

  // debug/compare sources
  livePoints: number;
  rolledPoints: number;

  // meta
  wallet?: string;
  userId?: string;
  dayUtc: string; // ISO string
  serverTime?: string; // ISO string

  // error (when ok=false)
  error?: string;
};

export type HourlyPoint = {
  ts?: string;   // ISO string
  time?: string; // "09:00"
  points: number;
  mbps?: number;
};

export type Tx = {
  ts: string;    // ISO string or "YYYY-MM-DD HH:mm"
  type: string;  // e.g., extension_farm / referral / convert_debit
  amount: number;
  note: string;
};

// ✅ ใช้ชื่อไม่ชนกับ DOM Range
export type DashboardRange = "today" | "7d" | "30d";
