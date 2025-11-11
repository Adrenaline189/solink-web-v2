import { NextResponse } from "next/server";
import { enqueueHourlyRollup } from "@/scripts/rollup-hourly";

export const runtime = "nodejs";          // ห้าม Edge (ต้องใช้ Node APIs)
export const dynamic = "force-dynamic";   // ให้เรียกได้ทุกครั้ง

export async function POST() {
  await enqueueHourlyRollup(); // ใช้ชั่วโมงปัจจุบัน (UTC)
  return NextResponse.json({ ok: true });
}

// อนุญาตลองยิงด้วย GET ชั่วคราว (ลบออกใน prod ถ้าไม่ต้องการ)
export async function GET() {
  await enqueueHourlyRollup();
  return NextResponse.json({ ok: true });
}
