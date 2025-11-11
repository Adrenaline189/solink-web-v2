// app/api/cron/rollup-hourly/route.ts
// ใช้สำหรับ trigger enqueue งาน rollup (ไม่รัน worker บน Vercel)
import { NextResponse } from "next/server";
import { enqueueHourlyRollup } from "@/scripts/rollup-hourly";

export const dynamic = "force-dynamic"; // หลีกเลี่ยง edge runtime

export async function GET() {
  await enqueueHourlyRollup();
  return NextResponse.json({ ok: true, queued: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const hourIso = typeof body?.hourIso === "string" ? body.hourIso : undefined;
    await enqueueHourlyRollup(hourIso);
    return NextResponse.json({ ok: true, queued: true, hourIso: hourIso ?? "auto" });
  } catch (_e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
