// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange, HourlyPoint } from "@/types/dashboard";
import { getHourly as getHourlySim } from "@/lib/dev-sim"; // fallback

export const dynamic = "force-dynamic";

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function mdLabel(d: Date) { return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`; }
function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = (url.searchParams.get("range") || "today") as DashboardRange;

    // --- TODAY: คืน 24 ช่องแบบถังรายชั่วโมง
    if (range === "today") {
      const start = startOfUTC();
      const end = addDays(start, 1);

      // เตรียม 24 bucket
      const buckets: HourlyPoint[] = Array.from({ length: 24 }, (_, h) => ({
        time: `${pad(h)}:00`,
        points: 0,
      }));

      try {
        // ปรับชื่อ model/field ให้ตรง schema ของคุณ
        const rows = await prisma.pointEvent.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { createdAt: true, amount: true },
        });

        for (const r of rows) {
          const h = new Date(r.createdAt).getUTCHours();
          buckets[h].points += r.amount ?? 0;
        }

        return NextResponse.json(buckets);
      } catch {
        // ถ้า DB ใช้ไม่ได้ ให้ fallback จำลอง
        return NextResponse.json(getHourlySim("today"));
      }
    }

    // --- 7D / 30D: รวมยอดรายวัน
    const days = range === "7d" ? 7 : 30;
    const end = addDays(startOfUTC(), 1);          // พรุ่งนี้ 00:00 UTC
    const start = addDays(end, -days);             // n วันก่อนหน้า
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      labels.push(mdLabel(addDays(end, -1 - i)));
    }

    try {
      const rows = await prisma.pointEvent.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { createdAt: true, amount: true },
      });

      // สร้าง map รายวัน
      const daily = new Map<string, number>();
      for (const r of rows) {
        const d = new Date(r.createdAt);
        const key = mdLabel(d);
        daily.set(key, (daily.get(key) ?? 0) + (r.amount ?? 0));
      }

      const out: HourlyPoint[] = labels.map((lbl) => ({
        time: lbl,
        points: daily.get(lbl) ?? 0,
      }));

      // ถ้าข้อมูลว่างทั้งหมด ให้ fallback ไป dev-sim
      if (out.every((x) => x.points === 0)) {
        return NextResponse.json(getHourlySim(range));
      }

      return NextResponse.json(out);
    } catch {
      return NextResponse.json(getHourlySim(range));
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "error" }, { status: 500 });
  }
}
