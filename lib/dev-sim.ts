// lib/dev-sim.ts
import type {
  DashboardSummary,
  HourlyPoint,
  Tx,
  DashboardRange,
} from "@/types/dashboard";

export type { DashboardRange };

/* ---------- demo seeds ---------- */
const INIT_SUMMARY: DashboardSummary = {
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

const INIT_TODAY: HourlyPoint[] = [
  { time: "09:00", points: 20, mbps: 0.8 },
  { time: "10:00", points: 65, mbps: 1.1 },
  { time: "11:00", points: 120, mbps: 1.3 },
  { time: "12:00", points: 160, mbps: 1.8 },
  { time: "13:00", points: 200, mbps: 2.0 },
  { time: "14:00", points: 240, mbps: 2.2 },
  { time: "15:00", points: 300, mbps: 2.6 },
];

const INIT_TX: Tx[] = [
  { ts: "2025-08-15 14:30", type: "Accrual",  amount: 120,   note: "Uptime slot bonus (+pts)" },
  { ts: "2025-08-15 13:10", type: "Convert",  amount: -1000, note: "Conversion → +1 SLK" },
  { ts: "2025-08-15 12:55", type: "Referral", amount: 50,    note: "Invite accepted (+pts)" },
  { ts: "2025-08-15 11:05", type: "Accrual",  amount: 80,    note: "Usage accrual (+pts)" },
];

/* ---------- tiny utils ---------- */
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function mdLabel(d: Date) { return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`; }
function lastNDaysLabels(n: number): string[] {
  const now = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push(mdLabel(d));
  }
  return out;
}

/* ---------- in-memory state ---------- */
const state: {
  summary: DashboardSummary;
  hourly: HourlyPoint[];
  tx: Tx[];
  inited: boolean;
} = {
  summary: structuredClone(INIT_SUMMARY),
  hourly: structuredClone(INIT_TODAY),
  tx: structuredClone(INIT_TX),
  inited: false,
};

function initIfNeeded() {
  if (state.inited) return;
  state.summary = structuredClone(INIT_SUMMARY);
  state.hourly = structuredClone(INIT_TODAY);
  state.tx = structuredClone(INIT_TX);
  state.inited = true;
}

/* ---------- public API (used by /api/dashboard/*) ---------- */
export function ensureSim() {
  initIfNeeded();
}

export function resetSim() {
  state.inited = false;
  initIfNeeded();
}

export function getSummary(): DashboardSummary {
  initIfNeeded();
  return state.summary;
}

export function getTx(_range: DashboardRange = "today"): Tx[] {
  initIfNeeded();
  // demo: return a single shared set
  return state.tx;
}

export function getHourly(range: DashboardRange = "today"): HourlyPoint[] {
  initIfNeeded();
  if (range === "today") return state.hourly;

  // simple daily aggregation for 7d/30d
  const days = range === "7d" ? 7 : 30;
  const labels = lastNDaysLabels(days);
  return labels.map((lbl, i) => {
    const base = range === "7d" ? 180 + i * 25 : 120 + i * 8;
    const wave = range === "7d" ? Math.sin(i) * 20 : Math.cos(i / 3) * 15;
    return { time: lbl, points: Math.max(0, Math.round(base + wave)), mbps: 1.2 + (i % 10) * 0.03 };
  });
}

/* ---------- optional: accrue demo points ---------- */
export function accrue(amountPts = 20, mbps = 1.5) {
  initIfNeeded();
  state.summary.pointsToday += amountPts;
  state.summary.totalPoints += amountPts;
  state.summary.avgBandwidthMbps = Number(((state.summary.avgBandwidthMbps * 4 + mbps) / 5).toFixed(2));
  state.summary.qf = Math.max(60, Math.min(98, state.summary.qf + (Math.random() > 0.6 ? 1 : 0)));
  state.summary.trust = Math.max(60, Math.min(96, state.summary.trust + (Math.random() > 0.7 ? 1 : 0)));

  const now = new Date();
  const label = `${pad(now.getHours())}:00`;
  const found = state.hourly.find(h => (h.time ?? "") === label);
  if (found) {
    found.points += amountPts;
    found.mbps = mbps;
  } else {
    state.hourly.push({ time: label, points: amountPts, mbps });
    if (state.hourly.length > 24) state.hourly.shift();
  }

  state.tx.unshift({
    ts: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`,
    type: "Accrual",
    amount: amountPts, // numeric, unit kept in note
    note: "Demo accrual (+pts)",
  });
}
