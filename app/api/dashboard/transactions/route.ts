// app/api/dashboard/transactions/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

/**
 * GET /api/dashboard/transactions?range=today|7d|30d
 *
 * คืนรายการ Recent Transactions บน Dashboard
 * - ใช้ข้อมูลจาก PointEvent ของ user ปัจจุบัน
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

function formatUtcLabel(d: Date): string {
  const iso = d.toISOString(); // 2025-12-02T14:35:10.123Z
  const base = iso.replace("T", " ").replace("Z", "");
  return `${base.slice(0, 19)} UTC`;
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
          items: [] as Array<{ ts: string; type: string; amount: number; note?: string | null }>,
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
          items: [] as Array<{ ts: string; type: string; amount: number; note?: string | null }>,
        },
        { status: 200 }
      );
    }

    const { startUtc, endUtc } = getRangeBounds(range);

    const events = await prisma.pointEvent.findMany({
      where: {
        userId: user.id,
        createdAt: {
          gte: startUtc,
          lt: endUtc,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    // ใส่ type ev เป็น any แบบ explicit
    const items = events.map((ev: any) => {
      let note: string | null = null;

      if (ev.meta && typeof ev.meta === "object") {
        const anyMeta = ev.meta as any;
        if (typeof anyMeta.note === "string") {
          note = anyMeta.note;
        } else if (typeof anyMeta.source === "string") {
          note = anyMeta.source;
        }
      }

      return {
        ts: formatUtcLabel(ev.createdAt),
        type: ev.type,
        amount: ev.amount,
        note,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        range,
        items,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("/api/dashboard/transactions error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
