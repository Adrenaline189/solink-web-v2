// app/api/dashboard/user-daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";


type Range = "today" | "7d" | "30d";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

function getRange(req: NextRequest): Range {
  const r = (req.nextUrl.searchParams.get("range") || "7d").toLowerCase();
  if (r === "today" || r === "7d" || r === "30d") return r;
  return "7d";
}

function startOfUtcDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

type UserDailyItem = {
  dayUtc: string;
  label: string; // YYYY-MM-DD
  points: number;
};

export async function GET(req: NextRequest) {
  try {
    const cookieWallet = cookies().get("solink_wallet")?.value;
    const wallet = (cookieWallet || "").trim();
    if (!wallet) return bad("wallet cookie required", 401);

    const user = await prisma.user.findUnique({
      where: { wallet },
      select: { id: true },
    });
    if (!user) return bad("user not found for this wallet", 404);

    const range = getRange(req);

    const today = startOfUtcDay(new Date());
    let from: Date;

    switch (range) {
      case "today":
        from = today;
        break;
      case "7d":
        from = new Date(today);
        from.setUTCDate(from.getUTCDate() - 6); // วันนี้ + ย้อนหลัง 6 วัน
        break;
      case "30d":
      default:
        from = new Date(today);
        from.setUTCDate(from.getUTCDate() - 29);
        break;
    }

    const rows = await prisma.metricsDaily.findMany({
      where: {
        userId: user.id,
        dayUtc: { gte: from },
      },
      orderBy: { dayUtc: "asc" },
      select: {
        dayUtc: true,
        pointsEarned: true,
      },
    });

    const items: UserDailyItem[] = rows.map(
      (r: { dayUtc: Date; pointsEarned: number }): UserDailyItem => ({
        dayUtc: r.dayUtc.toISOString(),
        label: r.dayUtc.toISOString().slice(0, 10), // YYYY-MM-DD
        points: r.pointsEarned,
      })
    );

    const total = items.reduce(
      (sum: number, it: UserDailyItem) => sum + it.points,
      0
    );

    return NextResponse.json({
      ok: true,
      range,
      total,
      items,
    });
  } catch (e: any) {
    console.error("user-daily error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status: 500 }
    );
  }
}
