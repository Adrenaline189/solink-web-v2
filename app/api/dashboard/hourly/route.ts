// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange, HourlyPoint } from "@/types/dashboard";
import { getHourly as getHourlySim } from "@/lib/dev-sim"; // fallback เมื่อ DB ใช้ไม่ได้

// บังคับให้รันแบบ SSR ทุกครั้ง (ไม่ใช้ cache ฝั่ง Next)
export const dynamic = "force-dynamic";

/* -------------------------- UTC helpers -------------------------- */
function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** label แบบ MM/DD โดยอิง UTC */
function mdLabelUTC(d: Date) {
  return `${pad(d.getUTCMonth() + 1)}/${pad(d.getUTCDate())}`;
}

/** เซ็ตเวลาเป็น 00:00:00.000 UTC ของวันที่ระบุ (ดีฟอลต์วันนี้) */
function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** บวก/ลบวันแบบ UTC โดยไม่ทำให้ข้ามโซน */
function addDaysUTC(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/** แปลงค่าที่อาจเป็น BigInt/nullable ให้เป็น number ปลอดภัย */
function toNum(v: unknown): number {
  if (typeof v === "bigint") return Number(v);
  if (typeof v === "number") return v;
  const n = Number((v as any) ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** จำกัดค่า range ให้อยู่ในชุดที่อนุญาต */
function normalizeRange(raw: string | null): DashboardRange {
  const v = (raw ?? "today").toLowerCase();
  return v === "7d" || v === "30d" || v === "today" ? v : "today";
}

/* ------------------------------- GET ------------------------------ */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const range = normalizeRange(url.searchParams.get("range"));

    // ===== TODAY: คืน 24 bucket (รายชั่วโมง, UTC) =====
    if (range === "today") {
      const start = startOfUTC(); // วันนี้ 00:00 UTC
      const end = addDaysUTC(start, 1); // พรุ่งนี้ 00:00 UTC

      // เตรียม 24 ช่อง
      const buckets: HourlyPoint[] = Array.from({ length: 24 }, (_, h) => ({
        time: `${pad(h)}:00`,
        points: 0,
      }));

      try {
        // ดึงอีเวนต์ในช่วงวันนี้ (UTC)
        const rows = await prisma.pointEvent.findMany({
          where: { createdAt: { gte: start, lt: end } },
          select: { createdAt: true, amount: true },
        });

        for (const r of rows) {
          const h = new Date(r.createdAt).getUTCHours();
          buckets[h].points += toNum(r.amount);
        }

        return NextResponse.json(buckets, {
          // ให้พฤติกรรม cache แบบ validate ทุกครั้ง (สอดคล้องกับที่คุณเช็ก)
          headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
        });
      } catch {
        // DB ใช้ไม่ได้ → ใช้ข้อมูลจำลอง
        return NextResponse.json(getHourlySim("today"), {
          headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
        });
      }
    }

    // ===== 7D / 30D: รวมยอดรายวัน (UTC) =====
    const days = range === "7d" ? 7 : 30;
    const end = addDaysUTC(startOfUTC(), 1); // พรุ่งนี้ 00:00 UTC
    const start = addDaysUTC(end, -days); // n วันก่อนหน้า

    // สร้าง labels ไล่จากเก่าสุด → ปัจจุบัน-1วัน (รวมทั้งหมด days วัน)
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      labels.push(mdLabelUTC(addDaysUTC(end, -1 - i)));
    }

    try {
      const rows = await prisma.pointEvent.findMany({
        where: { createdAt: { gte: start, lt: end } },
        select: { createdAt: true, amount: true },
      });

      // รวมยอดต่อวัน (key = MM/DD โดยอิง UTC)
      const daily = new Map<string, number>();
      for (const r of rows) {
        const d = new Date(r.createdAt);
        const key = mdLabelUTC(d);
        daily.set(key, (daily.get(key) ?? 0) + toNum(r.amount));
      }

      const out: HourlyPoint[] = labels.map((lbl) => ({
        time: lbl,
        points: daily.get(lbl) ?? 0,
      }));

      // ถ้าทั้งช่วงเป็นศูนย์หมด ให้ fallback เพื่อให้กราฟไม่โล่งบน demo
      if (out.every((x) => x.points === 0)) {
        return NextResponse.json(getHourlySim(range), {
          headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
        });
      }

      return NextResponse.json(out, {
        headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
      });
    } catch {
      return NextResponse.json(getHourlySim(range), {
        headers: { "Cache-Control": "public, max-age=0, must-revalidate" },
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "error" },
      { status: 500 }
    );
  }
}
