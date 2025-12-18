import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { awardPointEvent } from "@/lib/points/awardPointEvent";
import { DEFAULT_REWARD_RULE } from "@/lib/rewards/rules";
import { computeHourlyReward } from "@/lib/rewards/compute";

export const runtime = "nodejs";

function requireCronKey(req: Request) {
  const got = req.headers.get("x-cron-key") || "";
  const expected = process.env.CRON_KEY || "";
  return !!expected && got === expected;
}

function floorToDayUTC(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  try {
    if (!requireCronKey(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const hourUtc = body?.hourUtc ? new Date(String(body.hourUtc)) : new Date();
    hourUtc.setUTCMinutes(0, 0, 0);

    const rule = DEFAULT_REWARD_RULE;

    // 1) ดึง metrics ราย user ในชั่วโมงนี้ (ตัด global row)
    const rows = await prisma.metricsHourly.findMany({
      where: { hourUtc, userId: { not: null } },
      select: { userId: true, uptimePct: true, avgBandwidth: true },
    });

    const dayUtc = floorToDayUTC(hourUtc);

    let settled = 0;
    let skipped = 0;

    for (const r of rows) {
      const userId = r.userId!;
      const uptimePct = r.uptimePct ?? null;
      const downloadMbps = r.avgBandwidth ?? null;

      // 2) เลือก node ของ user (แบบง่าย: เอา node ตัวแรก)
      const node = await prisma.node.findFirst({
        where: { userId },
        select: { id: true, riskScore: true },
        orderBy: { createdAt: "asc" },
      });

      if (!node) {
        skipped++;
        continue;
      }

      // 3) ตรวจ cap (per node/day และ per user/day)
      const nodeEarnedToday = await prisma.pointEvent.aggregate({
        where: {
          nodeId: node.id,
          type: "REWARD_HOUR",
          occurredAt: { gte: dayUtc, lt: new Date(dayUtc.getTime() + 86400000) },
        },
        _sum: { amount: true },
      });

      const userEarnedToday = await prisma.pointEvent.aggregate({
        where: {
          userId,
          type: "REWARD_HOUR",
          occurredAt: { gte: dayUtc, lt: new Date(dayUtc.getTime() + 86400000) },
        },
        _sum: { amount: true },
      });

      const nodeSoFar = nodeEarnedToday._sum.amount ?? 0;
      const userSoFar = userEarnedToday._sum.amount ?? 0;

      if (nodeSoFar >= rule.maxPointsPerNodePerDay || userSoFar >= rule.maxPointsPerUserPerDay) {
        skipped++;
        continue;
      }

      // 4) compute reward
      const rr = computeHourlyReward(rule, {
        uptimePct,
        downloadMbps,
        riskScore: node.riskScore ?? 0,
      });

      if (!rr.eligible || rr.points <= 0) {
        skipped++;
        continue;
      }

      // apply remaining caps
      const nodeRemain = Math.max(0, rule.maxPointsPerNodePerDay - nodeSoFar);
      const userRemain = Math.max(0, rule.maxPointsPerUserPerDay - userSoFar);
      const capped = Math.min(rr.points, nodeRemain, userRemain);

      if (capped <= 0) {
        skipped++;
        continue;
      }

      // 5) award ledger event (dedupe key กันจ่ายซ้ำ)
      const dedupeKey = `${node.id}:REWARD_HOUR:${hourUtc.toISOString()}`;

      await awardPointEvent({
        userId,
        nodeId: node.id,
        type: "REWARD_HOUR",
        amount: capped,
        source: "worker",
        ruleVersion: rule.version,
        dedupeKey,
        meta: {
          hourUtc: hourUtc.toISOString(),
          uptimePct,
          downloadMbps,
          breakdown: rr.breakdown,
          raw: rr.points,
          capped,
        },
        signatureOk: true,
        riskScore: node.riskScore ?? 0,
        occurredAt: hourUtc,
      });

      settled++;
    }

    return NextResponse.json({
      ok: true,
      hourUtc: hourUtc.toISOString(),
      users: rows.length,
      settled,
      skipped,
      ruleVersion: rule.version,
    });
  } catch (e: any) {
    console.error("[rewards/settle-hour] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal server error" }, { status: 500 });
  }
}
