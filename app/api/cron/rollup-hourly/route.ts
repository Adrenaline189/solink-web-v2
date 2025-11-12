// ใช้สำหรับ trigger enqueue งาน rollup (ไม่รัน worker บน Vercel)
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * หมายเหตุสำคัญ:
 * - ห้าม import "@/scripts/rollup-hourly" ไว้ด้านบนไฟล์
 *   ให้ lazy import ภายใน handler เท่านั้น เพื่อกัน Next.js ไปแตะ Redis ตอน build
 */

export async function GET() {
  const { enqueueHourlyRollup } = await import("@/scripts/rollup-hourly");
  await enqueueHourlyRollup();
  return NextResponse.json({ ok: true, queued: true });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any));
    const hourIso = typeof body?.hourIso === "string" ? body.hourIso : undefined;

    const { enqueueHourlyRollup } = await import("@/scripts/rollup-hourly");
    await enqueueHourlyRollup(hourIso);

    return NextResponse.json({ ok: true, queued: true, hourIso: hourIso ?? "auto" });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
