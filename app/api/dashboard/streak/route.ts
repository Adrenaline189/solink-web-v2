// app/api/dashboard/streak/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function startOfUtcDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function GET(_req: NextRequest) {
  try {
    const cookieWallet = cookies().get("solink_wallet")?.value;
    const wallet = (cookieWallet || "").trim();
    if (!wallet) return bad("wallet cookie required", 401);

    const user = await prisma.user.findUnique({
      where: { wallet },
      select: { id: true },
    });
    if (!user) return bad("user not found for this wallet", 404);

    // ดึง MetricsDaily ย้อนหลังสูงสุด 1 ปี
    const since = new Date();
    since.setUTCFullYear(since.getUTCFullYear() - 1);

    const rows = await prisma.metricsDaily.findMany({
      where: {
        userId: user.id,
        dayUtc: { gte: since },
      },
      orderBy: { dayUtc: "desc" },
      select: { dayUtc: true, pointsEarned: true },
    });

    // map: "YYYY-MM-DD" -> points
    const map = new Map<string, number>();
    for (const r of rows) {
      const key = r.dayUtc.toISOString().slice(0, 10);
      map.set(key, r.pointsEarned);
    }

    const today = startOfUtcDay(new Date());

    let current = 0;
    let best = 0;

    let streak = 0;
    let currentRecorded = false;

    for (let i = 0; i < 365; i++) {
      const d = new Date(
        Date.UTC(
          today.getUTCFullYear(),
          today.getUTCMonth(),
          today.getUTCDate() - i
        )
      );
      const key = d.toISOString().slice(0, 10);
      const pts = map.get(key) ?? 0;

      if (pts > 0) {
        streak++;
      } else {
        // เจอวันแต้ม = 0 → ปิด streak ชุดนี้
        if (!currentRecorded) {
          current = streak;
          currentRecorded = true;
        }
        if (streak > best) best = streak;
        streak = 0;
      }
    }

    // เผื่อกรณียาวต่อเนื่องยาวถึงย้อนหลังสุด
    if (!currentRecorded) {
      current = streak;
    }
    if (streak > best) best = streak;

    return NextResponse.json({
      ok: true,
      current,
      best,
    });
  } catch (e: any) {
    console.error("streak error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
