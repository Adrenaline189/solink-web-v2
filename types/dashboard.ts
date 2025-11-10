// types/dashboard.ts

export type DashboardSummary = {
  pointsToday: number;
  totalPoints: number;
  slk: number;
  uptimeHours: number;
  goalHours: number;
  avgBandwidthMbps: number;
  qf: number;    // Quality Factor (0-100)
  trust: number; // Trust Score (0-100)
  region: string | null;
  ip: string | null;
  version: string | null;
};

export type HourlyPoint = {
  // Use either "ts" (ISO string) or "time" ("09:00")
  ts?: string;
  time?: string;
  points: number;
  mbps?: number;
};

export type Tx = {
  ts: string;    // ISO string or "YYYY-MM-DD HH:mm"
  type: string;  // e.g., Accrual / Convert / Referral
  amount: number;
  note: string;
};

export type Range = "today" | "7d" | "30d";
