// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("r") || searchParams.get("range") || "today";

  try {
    // ถ้าคุณมี endpoint จริงสำหรับ hourly ก็ fetch จากที่นั่น
    // ตัวอย่างนี้จะลองแปลงจาก events → บางที่คุณมีอยู่แล้ว
    const r = await fetch(`${API_BASE}/api/points/events?limit=200`, {
      credentials: "include",
      cache: "no-store",
    });

    if (!r.ok) throw new Error("upstream error");

    const data = (await r.json()) as {
      ok: boolean;
      events?: Array<{ createdAt: string; amount: number; type: string }>;
    };

    // สร้าง series คร่าว ๆ: group ต่อชั่วโมง/วัน แล้วรวมแต้ม
    const events = data?.events ?? [];
    const byKey = new Map<string, number>();

    for (const e of events) {
      const d = new Date(e.createdAt);
      if (range === "today") {
        const hh = `${`${d.getHours()}`.padStart(2, "0")}:00`;
        byKey.set(hh, (byKey.get(hh) || 0) + (e.amount || 0));
      } else {
        const md = `${`${d.getMonth() + 1}`.padStart(2, "0")}/${`${d.getDate()}`.padStart(2, "0")}`;
        byKey.set(md, (byKey.get(md) || 0) + (e.amount || 0));
      }
    }

    const keys = Array.from(byKey.keys()).sort();
    const hourly = keys.map((k) => ({
      time: k,
      points: byKey.get(k) || 0,
      mbps: 1 + (Math.random() * 1.5), // demo
    }));

    if (hourly.length === 0) throw new Error("empty");

    return NextResponse.json({ ok: true, hourly }, { status: 200 });
  } catch {
    // demo fallback เมื่อไม่มีข้อมูลจริง
    if (range === "today") {
      return NextResponse.json(
        {
          ok: true,
          hourly: [
            { time: "09:00", points: 20, mbps: 0.8 },
            { time: "10:00", points: 65, mbps: 1.1 },
            { time: "11:00", points: 120, mbps: 1.3 },
            { time: "12:00", points: 160, mbps: 1.8 },
            { time: "13:00", points: 200, mbps: 2.0 },
            { time: "14:00", points: 240, mbps: 2.2 },
            { time: "15:00", points: 300, mbps: 2.6 },
          ],
        },
        { status: 200 }
      );
    }
    // สร้าง 7d/30d demo
    const days = range === "7d" ? 7 : 30;
    const now = new Date();
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const label = `${`${d.getMonth() + 1}`.padStart(2, "0")}/${`${d.getDate()}`.padStart(2, "0")}`;
      const idx = days - 1 - i;
      const base = range === "7d" ? 180 + idx * 25 : 120 + idx * 8;
      const wave = range === "7d" ? Math.sin(i) * 20 : Math.cos(i / 3) * 15;
      out.push({
        time: label,
        points: Math.max(0, Math.round(base + wave)),
        mbps: 1.2 + (idx % 10) * 0.03,
      });
    }
    return NextResponse.json({ ok: true, hourly: out }, { status: 200 });
  }
}
