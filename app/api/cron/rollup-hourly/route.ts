import { NextResponse } from "next/server";
import { enqueueHourlyRollup } from "@/scripts/rollup-hourly";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  await enqueueHourlyRollup();
  return NextResponse.json({ ok: true });
}

export async function GET() {
  await enqueueHourlyRollup();
  return NextResponse.json({ ok: true });
}
