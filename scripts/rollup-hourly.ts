// scripts/rollup-hourly.ts
// Full file: computes SYSTEM MetricsHourly (userId = null) for a given UTC hour.
//
// Usage (from your runner):
//   import { enqueueHourlyRollup } from "./rollup-hourly.js";
//   await enqueueHourlyRollup("2025-12-29T12:00:00Z");
//
// Notes:
// - Assumes Prisma client at "@/lib/prisma" (as in your API routes).
// - Works with your schema:
//   - PointEvent: source, meta(Json?), occurredAt, amount(Int), etc.
//   - Node: trustScore(Float), region(String?)
//   - MetricsHourly: hourUtc, userId?, pointsEarned, avgBandwidth, qfScore, trustScore, region
//
import { prisma } from "@/lib/prisma";

function toTopOfHourUTC(iso: string): Date {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid hour ISO: ${iso}`);
  d.setUTCMinutes(0, 0, 0);
  return d;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = nums.reduce((a, b) => a + b, 0);
  return s / nums.length;
}

function mostCommonString(values: Array<string | null | undefined>): string | null {
  const map = new Map<string, number>();

  for (const v of values) {
    if (!v) continue;
    map.set(v, (map.get(v) ?? 0) + 1);
  }

  let best: string | null = null;
  let bestCount = 0;

  map.forEach((count, key) => {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  });

  return best;
}


type RollupResult = {
  hourUtc: string;
  pointsEarned: number;
  avgBandwidth: number | null;
  trustScore: number | null; // 0..1 (same scale as Node.trustScore)
  qfScore: number | null;    // 0..100
  region: string | null;
};

export async function enqueueHourlyRollup(hourIso: string): Promise<RollupResult> {
  const hourStart = toTopOfHourUTC(hourIso);
  const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);

  // 1) System points this hour
  const pointsAgg = await prisma.pointEvent.aggregate({
    where: {
      occurredAt: { gte: hourStart, lt: hourEnd },
    },
    _sum: { amount: true },
  });
  const systemPoints = pointsAgg._sum.amount ?? 0;

  // 2) Bandwidth: from PointEvent.meta.downloadMbps where source="sharing"
  //    We accept meta as Json and try to read downloadMbps as number.
  const bwEvents = await prisma.pointEvent.findMany({
    where: {
      occurredAt: { gte: hourStart, lt: hourEnd },
      source: "sharing",
      meta: { not: null },
    },
    select: { meta: true },
    take: 5000, // safety; adjust if you expect more
  });

  const bwValues: number[] = [];
  for (const e of bwEvents) {
    const mbps = (e.meta as any)?.downloadMbps;
    if (typeof mbps === "number" && Number.isFinite(mbps) && mbps >= 0) {
      bwValues.push(mbps);
    }
  }
  const avgBandwidth = avg(bwValues);

  // 3) Trust / region: from Node table
  const nodes = await prisma.node.findMany({
    select: { trustScore: true, region: true },
  });

  const trustValues = nodes
    .map((n) => n.trustScore)
    .filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const avgTrust = trustValues.length ? trustValues.reduce((a, b) => a + b, 0) / trustValues.length : null;
  const region = mostCommonString(nodes.map((n) => n.region));

  // 4) QF score (simple v1):
  //    - bandwidth percent vs MAX_MBPS
  //    - trust percent = trustScore * 100
  //    - qf = 50/50
  const MAX_MBPS = 50; // adjust later if you want
  const bwPct = avgBandwidth != null ? Math.min(100, (avgBandwidth / MAX_MBPS) * 100) : 0;
  const trustPct = avgTrust != null ? Math.min(100, avgTrust * 100) : 0;

  const qfScore = Math.round(0.5 * bwPct + 0.5 * trustPct);

  // 5) Upsert SYSTEM MetricsHourly (userId = null)
  await prisma.metricsHourly.upsert({
    where: {
      hourUtc_userId_unique: {
        hourUtc: hourStart,
        userId: null, // SYSTEM ROW
      },
    },
    update: {
      pointsEarned: systemPoints,
      avgBandwidth: avgBandwidth,
      trustScore: avgTrust,
      qfScore: qfScore,
      region: region,
      // version: null, // optional
    },
    create: {
      hourUtc: hourStart,
      userId: null,
      pointsEarned: systemPoints,
      avgBandwidth: avgBandwidth,
      trustScore: avgTrust,
      qfScore: qfScore,
      region: region,
      // version: null, // optional
    },
  });

  const out: RollupResult = {
    hourUtc: hourStart.toISOString(),
    pointsEarned: systemPoints,
    avgBandwidth,
    trustScore: avgTrust,
    qfScore,
    region,
  };

  // handy log for worker
  console.log("[rollup-hourly][system]", out);

  return out;
}
