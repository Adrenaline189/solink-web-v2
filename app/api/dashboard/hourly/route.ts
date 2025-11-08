import { NextResponse } from "next/server";
import { ensureSim, getHourly } from "@/lib/dev-sim";
import type { Range } from "@/lib/dev-sim";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    ensureSim();
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as Range) || "today";
    const data = getHourly(range);
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
