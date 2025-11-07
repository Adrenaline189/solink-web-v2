// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
import { apiGet } from "@/lib/server/api";

export const dynamic = "force-dynamic";

// demo fallback ง่าย ๆ
const DEMO_TODAY = [
  { time: "09:00", points: 20, mbps: 0.8 },
  { time: "10:00", points: 65, mbps: 1.1 },
  { time: "11:00", points: 120, mbps: 1.3 },
  { time: "12:00", points: 160, mbps: 1.8 },
  { time: "13:00", points: 200, mbps: 2.0 },
  { time: "14:00", points: 240, mbps: 2.2 },
  { time: "15:00", points: 300, mbps: 2.6 },
];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || searchParams.get("r") || "today";

  try {
    // ถ้ามี upstream จริงสำหรับกราฟ ก็เรียกตรงนี้
    // ตัวอย่าง: api/points/events?limit=... แล้ว map เป็น hourly
    const ev = await apiGet<{ ok: boolean; events: Array<{ createdAt: string; amount: number }> }>(
      "/api/points/events?limit=200"
    );

    // แปลง events → bins รายชั่วโมง (เดโม่อย่างง่าย)
    const byHour = new Map<string, number>();
    (ev?.events || []).forEach((e) => {
      const d = new Date(e.createdAt);
      const hh = d.toTimeString().slice(0, 2);
      const key = `${hh}:00`;
      byHour.set(key, (byHour.get(key) || 0) + (e.amount || 0));
    });
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
    const hourly = hours.map((h) => ({
      time: h,
      points: byHour.get(h) || 0,
      mbps: 1 + (hours.indexOf(h) % 10) * 0.05, // เดโม่ค่าแบนด์วิธ
    }));

    return NextResponse.json({ ok: true, hourly });
  } catch {
    // fallback demo
    if (range === "today") return NextResponse.json({ ok: true, hourly: DEMO_TODAY });
    // range 7d/30d → สร้างปลอมง่าย ๆ
    const days = range === "7d" ? 7 : 30;
    const now = new Date();
    const out = Array.from({ length: days }, (_, idx) => {
      const d = new Date(now);
      d.setDate(now.getDate() - (days - 1 - idx));
      const label = `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
      return { time: label, points: 150 + idx * 10, mbps: 1.2 + (idx % 10) * 0.03 };
    });
    return NextResponse.json({ ok: true, hourly: out });
  }
}
