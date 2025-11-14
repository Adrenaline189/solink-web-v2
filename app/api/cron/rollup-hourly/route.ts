import { NextRequest, NextResponse } from "next/server";
import { enqueueHourlyRollup } from "@/scripts/rollup-hourly";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const headerKey = req.headers.get("x-cron-key");
  const vercelCron = req.headers.get("x-vercel-cron");
  const envKey = process.env.CRON_KEY;

  // อนุญาต 2 ทาง:
  // 1) มี X-CRON-KEY ตรงกับ env
  // 2) มาจาก Vercel Cron (มี header x-vercel-cron: "1")
  const authorized =
    (envKey && headerKey === envKey) ||
    vercelCron === "1";

  if (!authorized) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const hourIso = "auto";

    // 🔥 จุดสำคัญ: สั่งเข้า queue ให้ worker ทำงาน ไม่ทำงานหนักในฟังก์ชันนี้
    await enqueueHourlyRollup(hourIso);

    return NextResponse.json(
      {
        ok: true,
        queued: true,
        hourIso,
      },
      { status: 200 },
    );
  } catch (err: any) {
    console.error("[cron][rollup-hourly] error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "rollup_failed",
        message: err?.message ?? "unknown_error",
      },
      { status: 500 },
    );
  }
}

export function GET() {
  // กันคนเปิดเล่นด้วย browser เฉย ๆ
  return NextResponse.json({
    ok: true,
    message: "Use POST (Vercel Cron or X-CRON-KEY) to enqueue hourly rollup",
  });
}
