// app/api/dashboard/streak/route.ts
// Calculates current + best streak from pointEvents (no metricsDaily needed)
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

export async function GET(_req: NextRequest) {
  try {
    const cookieStore = cookies();
    const cookieWallet = cookieStore.get("solink_wallet")?.value;
    const wallet = (cookieWallet || "").trim();
    if (!wallet) return bad("wallet cookie required", 401);

    const user = await prisma.user.findUnique({ where: { wallet }, select: { id: true } });
    if (!user) return bad("user not found for this wallet", 404);

    // Get daily point totals from pointEvents (last 365 days)
    const since = new Date();
    since.setUTCFullYear(since.getUTCFullYear() - 1);
    since.setUTCHours(0, 0, 0, 0);

    const rows = await prisma.$queryRaw<{ day_label: Date; total: bigint }[]>`
      SELECT
        DATE_TRUNC('day', "occurredAt" AT TIME ZONE 'UTC') AS day_label,
        SUM("amount")::bigint AS total
      FROM "PointEvent"
      WHERE "userId" = ${user.id}
        AND "occurredAt" >= ${since}
        AND "amount" > 0
      GROUP BY 1
      ORDER BY 1 ASC
    `;

    // Map: "YYYY-MM-DD" -> has points
    // Prisma 6 returns Date objects for date_trunc, convert to ISO string first
    const dayMap = new Map<string, boolean>();
    for (const r of rows) {
      const label = String(r.day_label).slice(0, 10);
      dayMap.set(label, Number(r.total) > 0);
    }

    const today = startOfUtcDay(new Date());

    let current = 0;
    let best = 0;
    let streak = 0;
    let currentRecorded = false;

    for (let i = 0; i < 365; i++) {
      const d = new Date(
        Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i)
      );
      const key = d.toISOString().slice(0, 10);
      const hasPoints = dayMap.get(key) ?? false;

      if (hasPoints) {
        streak++;
      } else {
        if (!currentRecorded) {
          current = streak;
          currentRecorded = true;
        }
        if (streak > best) best = streak;
        streak = 0;
      }
    }

    if (!currentRecorded) {
      current = streak;
    }
    if (streak > best) best = streak;

    return NextResponse.json({ ok: true, current, best });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("streak error:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
