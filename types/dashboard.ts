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
  region: string;
  ip: string;
  version: string;
};

export type HourlyPoint = {
  // ใช้ "ts" (ISO string) หรือ "time" ("09:00") ได้อย่างใดอย่างหนึ่ง
  ts?: string;
  time?: string;
  points: number;
  mbps?: number;
};

export type Tx = {
  ts: string;   // ISO string หรือ "YYYY-MM-DD HH:mm"
  type: string; // e.g. Accrual / Convert / Referral
  amount: string;
  note: string;
};
