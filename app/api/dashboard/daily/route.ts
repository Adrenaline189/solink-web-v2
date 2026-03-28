// app/api/dashboard/daily/route.ts
// User's daily points — reads from pointEvents grouped by day
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthContext } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const daysParam = searchParams.get("days") ?? "30";
    const days = Math.min(Math.max(parseInt(daysParam, 10) || 30, 1), 365);

    // Auth: get user from cookie/JWT
    const ctx = await getAuthContext(req);
    const wallet = ctx?.wallet ?? searchParams.get("wallet");

    if (!wallet) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findFirst({ where: { wallet }, select: { id: true } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setUTCDate(fromDate.getUTCDate() - (days - 1));
    fromDate.setUTCHours(0, 0, 0, 0);

    // Group pointEvents by day using raw SQL
    const rows = await prisma.$queryRaw<{ day_label: string; total: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') AS day_label,
        SUM("amount")::bigint AS total
      FROM "PointEvent"
      WHERE "userId" = ${user.id}
        AND "occurredAt" >= ${fromDate}
        AND "amount" > 0
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    const dayMap = new Map<string, number>();
    for (const r of rows) {
      dayMap.set(r.day_label.slice(0, 10), Number(r.total));
    }

    // Build full range of days
    const data = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(fromDate);
      d.setUTCDate(d.getUTCDate() + i);
      const label = d.toISOString().slice(0, 10);
      data.push({
        dayUtc: d.toISOString(),
        pointsEarned: dayMap.get(label) ?? 0,
        uptimePct: 0,
        avgBandwidthMbps: 0,
        qfScore: 0,
        trustScore: 0,
      });
    }

    return NextResponse.json({ ok: true, userId: user.id, days, data }, { status: 200 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[GET /api/dashboard/daily] error", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
