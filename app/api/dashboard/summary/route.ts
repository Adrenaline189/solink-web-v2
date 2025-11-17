import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* --------------------------- helpers --------------------------- */
function toNum(v: any): number {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function addDaysUTC(d: Date, n: number) {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x;
}

/* ----------------------------- GET ----------------------------- */
export async function GET() {
  try {
    // วันนี้แบบ UTC
    const start = startOfUTC();
    const end = addDaysUTC(start, 1);

    // ค่า summary หลัก ๆ (ค่าเริ่มต้น)
    let pointsToday = 0;
    let uptimeHours = 0;
    const goalHours = 8;
    let avgBandwidthMbps = 0;
    let qf = 0;
    let trust = 0;

    // ✅ พยายามอ่านจาก MetricsDaily (system) ก่อน
    try {
      const md = await prisma.metricsDaily.findFirst({
        where: {
          dayUtc: start,
          userId: "system", // แถวสรุประบบ (system row)
        },
        select: {
          pointsEarned: true,
          uptimePct: true,
          avgBandwidth: true,
          qfScore: true,
          trustScore: true,
        },
      });

      if (md) {
        pointsToday = toNum(md.pointsEarned);

        // uptimePct (0–100) → ชั่วโมงจาก 24 ชม. (ปัดทศนิยม 1 ตำแหน่ง)
        if (md.uptimePct != null) {
          const pct = toNum(md.uptimePct);
          uptimeHours = Number(((pct / 100) * 24).toFixed(1));
        }

        // Mbps เฉลี่ย
        if (md.avgBandwidth != null) {
          avgBandwidthMbps = toNum(md.avgBandwidth);
        }

        // QF / Trust จาก MetricsDaily (0–100)
        if (md.qfScore != null) {
          qf = Math.max(0, Math.min(100, Math.round(toNum(md.qfScore))));
        }
        if (md.trustScore != null) {
          trust = Math.max(0, Math.min(100, Math.round(toNum(md.trustScore))));
        }
      }

      // สำรอง: ถ้ายังไม่มี pointsToday ใน MetricsDaily ให้ sum จาก MetricsHourly
      if (pointsToday === 0) {
        const mh = await prisma.metricsHourly.aggregate({
          _sum: { pointsEarned: true },
          where: {
            userId: "system",
            hourUtc: { gte: start, lt: end },
          },
        });
        pointsToday = toNum(mh._sum.pointsEarned);
      }
    } catch {
      // ถ้า schema / query พัง ให้กลับไปค่าเริ่มต้น 0
      pointsToday = 0;
      uptimeHours = 0;
      avgBandwidthMbps = 0;
      qf = 0;
      trust = 0;
    }

    // 🧩 Fallback เดิม: ถ้า QF/Trust ยังเป็น 0 ให้เดาจาก MetricsHourly ของวันนี้
    if (qf === 0 || trust === 0) {
      try {
        const lastSystemHour = await prisma.metricsHourly.findFirst({
          where: {
            userId: "system",
            hourUtc: { gte: start, lt: end },
          },
          orderBy: { hourUtc: "desc" },
          select: { qfScore: true },
        });

        qf = Math.max(
          0,
          Math.min(100, Math.round(lastSystemHour?.qfScore ?? 0))
        );

        const nonZeroHours = await prisma.metricsHourly.count({
          where: {
            userId: "system",
            hourUtc: { gte: start, lt: end },
            pointsEarned: { gt: 0 },
          },
        });

        // 1 ชม. ที่มี traffic = 5 คะแนน trust (max 100)
        trust = Math.max(0, Math.min(100, nonZeroHours * 5));
      } catch {
        // ถ้า query พัง ก็ปล่อยเป็น 0
      }
    }

    // รวมยอด balance ทั้งระบบ
    const totalAgg = await prisma.pointBalance.aggregate({
      _sum: { balance: true },
    });
    const totalPoints = toNum(totalAgg._sum.balance);

    // แปลงเป็น SLK (ตอนนี้ใช้ totalPoints / 1000)
    const slk = Number((totalPoints / 1000).toFixed(2));

    // optional: system meta (region/ip/version)
    let region: string | null = null;
    let ip: string | null = null;
    let version: string | null = null;

    try {
      const [r, i, v] = await Promise.all([
        prisma.setting.findFirst({ where: { key: "region" } }),
        prisma.setting.findFirst({ where: { key: "ip" } }),
        prisma.setting.findFirst({ where: { key: "version" } }),
      ]);
      region = r?.value ?? null;
      ip = i?.value ?? null;
      version = v?.value ?? null;
    } catch {
      // ถ้า setting พัง ก็ปล่อยเป็น null
    }

    const payload = {
      pointsToday,
      totalPoints,
      slk,
      uptimeHours,
      goalHours,
      avgBandwidthMbps,
      qf,
      trust,
      region,
      ip,
      version,
    };

    return NextResponse.json(
      {
        ok: true,
        summary: payload,
        // เพื่อให้โค้ดเดิมที่ใช้ field แบน ๆ ยังใช้งานได้อยู่
        ...payload,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (e: any) {
    console.error("dashboard/summary error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 }
    );
  }
}
