// app/api/dashboard/hourly/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ensureSim, getHourly } from "@/lib/dev-sim";
import type { DashboardRange } from "@/types/dashboard";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const r = (searchParams.get("r") || "today") as DashboardRange;

  const cookieHdr = req.headers.get("cookie") || "";
  const sim = /(?:^|;\s*)solink_sim=1(?:;|$)/.test(cookieHdr);
  if (sim) ensureSim();

  try {
    const hourly = getHourly(r);
    return NextResponse.json({ ok: true, hourly }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    // ถ้าพัง ให้คืนว่างแล้วให้ฝั่ง client ใช้ fallback
    return NextResponse.json({ ok: true, hourly: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
