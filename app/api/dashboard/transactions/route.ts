// app/api/dashboard/transactions/route.ts
import { NextResponse } from "next/server";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { ensureSim, getTx, type Range } from "@/lib/dev-sim";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const r = (searchParams.get("r") || "today") as Range;

  const cookieHdr = req.headers.get("cookie") || "";
  const sim = /(?:^|;\s*)solink_sim=1(?:;|$)/.test(cookieHdr);
  if (sim) ensureSim();

  try {
    const tx = getTx(r);
    return NextResponse.json({ ok: true, tx }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: true, tx: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
