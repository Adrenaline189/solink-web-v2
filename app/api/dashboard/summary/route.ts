// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { apiGet } from "@/lib/server/api";

export const dynamic = "force-dynamic";

const DEMO = {
  pointsToday: 320,
  totalPoints: 12450,
  slk: 12.45,
  uptimeHours: 6,
  goalHours: 8,
  avgBandwidthMbps: 2.1,
  qf: 82,
  trust: 74,
  region: "SG1",
  ip: "203.0.113.42",
  version: "v0.4.2",
};

export async function GET() {
  try {
    // ตัวอย่าง upstream ที่คุณมีจริง อาจเปลี่ยน path ได้ตาม API ของคุณ
    // สมมติคุณจะรวมจาก /api/points/balance + /api/health
    const [bal, health] = await Promise.all([
      apiGet<{ ok: boolean; balance: number }>("/api/points/balance"),
      apiGet<{ ok: boolean }>("/api/health"),
    ]);

    const summary = {
      ...DEMO,
      totalPoints: bal?.balance ?? DEMO.totalPoints,
      // ปรับ logic ให้เหมาะกับข้อมูลจริงของคุณได้
    };

    return NextResponse.json({ ok: true, summary });
  } catch (_e) {
    // fallback demo
    return NextResponse.json({ ok: true, summary: DEMO });
  }
}
