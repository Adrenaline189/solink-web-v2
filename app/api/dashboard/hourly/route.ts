// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

/**
 * GET /api/dashboard/hourly?range=today|7d|30d
 *
 * คืนข้อมูลกราฟ Hourly Points (User) สำหรับ Dashboard
 * - อิงจาก MetricsHourly ของ user ปัจจุบัน (userId จาก wallet)
 * - แปลงเป็น array ของ HourlyPoint (label + points)
 *
 * response:
 * {
 *   ok: true,
 *   range: "today" | "7d" | "30d",
 *   startUtc: string | null,
 *   endUtc: string | null,
 *   items: Array<{ label: string; points: number }>
 * }
 */

function truncateToDayUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function getRangeBounds(range: DashboardRange): { startUtc: Date; endUtc: Date } {
  const now = new Date();
  const endDay = truncateToDayUtc(now);
  let startDay = new Date(endDay);

  switch (range) {
    case "7d": {
      startDay = new Date(endDay);
      startDay.setUTCDate(startDay.getUTCDate() - 6);
      break;
    }
    case "30d": {
      startDay = new Date(endDay);
      startDay.setUTCDate(startDay.getUTCDate() - 29);
      break;
    }
    case "today":
    default: {
      startDay = new Date(endDay);
      break;
    }
  }

  const startUtc = startDay;
  const endUtc = new Date(endDay);
  endUtc.setUTCDate(endUtc.getUTCDate() + 1);

  return { startUtc, endUtc };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get("range") as DashboardRange | null;
    const range: DashboardRange = rangeParam === "7d" || rangeParam === "30d" ? rangeParam : "today";

    const cookieStore = cookies();
    const wallet = cookieStore.get("solink_wallet")?.value ?? null;

    if (!wallet) {
      return NextResponse.json(
        {
          ok: true,
          range,
          startUtc: null,
          endUtc: null,
          items: [] as Array<{ label: string; points: number }>,
        },
        { status: 200 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { wallet },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: true,
          range,
          startUtc: null,
          endUtc: null,
          items: [] as Array<{ label: string; points: number }>,
        },
        { status: 200 }
      );
    }

    const { startUtc, endUtc } = getRangeBounds(range);

    const rows = await prisma.metricsHourly.findMany({
      where: {
        userId: user.id,
        hourUtc: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      orderBy: { hourUtc: "asc" },
    });

    // ใส่ type ให้ r เป็น any แบบ explicit เพื่อกัน noImplicitAny
    const items = rows.map((r: any) => {
      const d = new Date(r.hourUtc);
      const h = d.getUTCHours().toString().padStart(2, "0");
      const md = `${(d.getUTCMonth() + 1).toString().padStart(2, "0")}/${d
        .getUTCDate()
        .toString()
        .padStart(2, "0")}`;

      const label = range === "today" ? `${h}:00` : `${md} ${h}:00`;

      return {
        label,
        points: r.pointsEarned ?? 0,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        range,
        startUtc: startUtc.toISOString(),
        endUtc: endUtc.toISOString(),
        items,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/dashboard/hourly error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
