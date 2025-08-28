// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ensureSim, getHourly } from "@/lib/dev-sim"; // ถ้าไม่มีไฟล์นี้ ให้ดูหมายเหตุด้านล่าง

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const r = (searchParams.get("r") || "today") as "today" | "7d" | "30d";

  // เปิดโหมด demo/sim ด้วยคุกกี้ solink_sim=1 ได้
  const cookieHdr = req.headers.get("cookie") || "";
  const sim = /(?:^|;\s*)solink_sim=1(?:;|$)/.test(cookieHdr);
  if (sim) ensureSim();

  // ถ้ามี dev-sim จะคืนข้อมูลจำลองตามช่วง; ถ้าไม่มี ให้คืนเปล่าๆ ไปให้ฝั่ง client ใช้ fallback
  try {
    const hourly = sim ? getHourly(r) : [];
    return NextResponse.json({ ok: true, hourly }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: true, hourly: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
