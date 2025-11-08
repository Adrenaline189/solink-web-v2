import { NextResponse } from "next/server";
import { ensureSim, getSummary } from "@/lib/dev-sim";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    ensureSim();
    const data = getSummary();
    return NextResponse.json(data, {
      headers: { "cache-control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 }
    );
  }
}
