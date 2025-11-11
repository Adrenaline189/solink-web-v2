// app/api/cron/rollup-hourly/route.ts
import { NextResponse } from "next/server";
import { enqueueHourlyRollup } from "@/scripts/rollup-hourly";

export async function POST() {
  await enqueueHourlyRollup(); // ใช้ชั่วโมงปัจจุบัน (UTC)
  return NextResponse.json({ ok: true });
}
