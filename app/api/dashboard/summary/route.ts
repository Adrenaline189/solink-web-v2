// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ตัวอย่าง: ลองดึง balance จริง (ถ้าตั้ง proxy ไว้ที่ /api/* จะชี้มายัง backend ของคุณ)
    const r = await fetch(`${API_BASE}/api/points/balance`, {
      headers: { "Content-Type": "application/json" },
      // ถ้ามี cookie ไว้ auth ให้ส่งไปด้วย
      credentials: "include",
      cache: "no-store",
    });

    // ถ้าต่อ backend ไม่ได้ก็ใช้ demo
    if (!r.ok) {
      return NextResponse.json(
        {
          ok: true,
          summary: {
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
          },
        },
        { status: 200 }
      );
    }

    const json = (await r.json()) as { ok: boolean; balance?: number };
    const totalPoints = Number(json?.balance ?? 12450);
    return NextResponse.json(
      {
        ok: true,
        summary: {
          pointsToday: 320,           // TODO: ใส่ค่าจริงถ้ามี endpoint hours/today
          totalPoints,
          slk: +(totalPoints / 1000).toFixed(2),
          uptimeHours: 6,
          goalHours: 8,
          avgBandwidthMbps: 2.1,
          qf: 82,
          trust: 74,
          region: "SG1",
          ip: "203.0.113.42",
          version: "v0.4.2",
        },
      },
      { status: 200 }
    );
  } catch (e) {
    return NextResponse.json(
      {
        ok: true,
        summary: {
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
        },
      },
      { status: 200 }
    );
  }
}
