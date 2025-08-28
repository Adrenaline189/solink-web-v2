// app/api/dashboard/summary/route.ts
import { NextResponse } from "next/server";
import { getSummary, ensureSim } from "@/lib/dev-sim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cookieHdr = req.headers.get("cookie") || "";
  const sim = /(?:^|;\s*)solink_sim=1(?:;|$)/.test(cookieHdr);

  if (sim) {
    ensureSim(); // init ถ้ายังไม่เคย
    return NextResponse.json({ ok: true, summary: getSummary() }, { headers: { "Cache-Control": "no-store" } });
  }

  // เดิม: คุณอาจมีแหล่งจริง; ถ้ายังไม่มีให้ส่ง demo เดิมได้เช่นกัน
  // เพื่อความง่าย: ใช้ dev-sim เป็นดีฟอลต์ในตอนนี้
  return NextResponse.json({ ok: true, summary: getSummary() }, { headers: { "Cache-Control": "no-store" } });
}
