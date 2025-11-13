import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * IMPORTANT:
 * - Do NOT import "@/scripts/rollup-hourly" at the top level.
 *   Always lazy-import inside the handler to avoid touching Redis during build.
 */

function getCronSecret(): string | null {
  // รองรับทั้ง CRON_SECRET และ CRON_KEY เผื่อใช้คนละชื่อระหว่าง local / Vercel
  return process.env.CRON_SECRET ?? process.env.CRON_KEY ?? null;
}

function isAuthorized(request: Request): boolean {
  const secret = getCronSecret();
  if (!secret) return false;

  // 1) รองรับ Authorization: Bearer <secret> (เหมาะกับ Vercel Cron)
  const authHeader =
    request.headers.get("authorization") ??
    request.headers.get("Authorization");

  if (authHeader && authHeader === `Bearer ${secret}`) {
    return true;
  }

  // 2) รองรับ X-CRON-KEY: <secret> (ใช้กับ curl / launchd บนเครื่องเรา)
  const cronKeyHeader =
    request.headers.get("x-cron-key") ??
    request.headers.get("X-CRON-KEY");

  if (cronKeyHeader && cronKeyHeader === secret) {
    return true;
  }

  return false;
}

async function enqueue(hourIso?: string) {
  // lazy import กัน Next ไปแตะ Redis ตอน build
  const { enqueueHourlyRollup } = await import("@/scripts/rollup-hourly");
  await enqueueHourlyRollup(hourIso);
}

// ใช้เรียกแบบ GET ง่ายๆ (เช่นเช็คจาก browser / curl)
// ต้องส่ง header auth มาด้วยเหมือน POST
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  await enqueue(); // hourIso = auto
  return NextResponse.json({ ok: true, queued: true, hourIso: "auto" });
}

// ใช้กับ Vercel Cron + manual replay (ส่ง hourIso เองได้)
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  let hourIso: string | undefined;

  try {
    const body = await request.json().catch(() => null);
    if (body && typeof body.hourIso === "string" && body.hourIso.trim() !== "") {
      hourIso = body.hourIso;
    }
  } catch {
    // body พังหรือไม่ใช่ JSON → ปล่อยเป็น auto ไป
  }

  await enqueue(hourIso);

  return NextResponse.json({
    ok: true,
    queued: true,
    hourIso: hourIso ?? "auto",
  });
}
