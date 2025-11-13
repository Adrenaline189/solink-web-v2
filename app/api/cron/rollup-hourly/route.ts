// app/api/cron/rollup-hourly/route.ts
import { NextRequest, NextResponse } from "next/server";
// 👇 เปลี่ยนชื่อฟังก์ชัน/ที่อยู่ import ให้ตรงกับโปรเจกต์จริง ถ้าต่างจากนี้
import { enqueueRollupHourlyJob } from "@/lib/rollup-queue";

export const runtime = "nodejs";

// ----- Helper: อ่าน secret ที่ใช้ตรวจสอบ -----
function getCronSecret(): string | null {
  // คุณจะตั้งตัวไหนบน Vercel ก็ได้ อันนี้รองรับหลายชื่อ
  return (
    process.env.CRON_SECRET ??
    process.env.CRON_KEY ??
    process.env.CRON_TOKEN ??
    null
  );
}

// ----- Helper: ตรวจว่ามาจาก Cron จริงหรือไม่ -----
function isAuthorized(req: NextRequest): boolean {
  const secret = getCronSecret();
  if (!secret) {
    // ถ้าไม่มี secret ให้ reject ไปก่อน ป้องกันเผลอเปิด endpoint ทิ้งไว้
    return false;
  }

  // 1) รองรับ Vercel Cron: ใช้ Authorization: Bearer <secret>
  const auth =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const bearerToken =
    auth && auth.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;

  if (bearerToken && bearerToken === secret) {
    return true;
  }

  // 2) รองรับ local cron/launchd: ใช้ X-CRON-KEY: <secret>
  const xKey =
    req.headers.get("x-cron-key") ?? req.headers.get("X-CRON-KEY") ?? null;

  if (xKey && xKey === secret) {
    return true;
  }

  return false;
}

// ----- Logic หลัก: enqueue งาน rollup -----
async function handleRollup(req: NextRequest) {
  // รองรับส่ง hourIso มาทาง body (JSON) หรือไม่ส่งก็ได้
  let hourIso: string | undefined;

  try {
    if (req.method === "POST") {
      const body = (await req.json().catch(() => null)) as
        | { hourIso?: string }
        | null;

      if (body?.hourIso && typeof body.hourIso === "string") {
        hourIso = body.hourIso;
      }
    }
  } catch {
    // body ไม่ใช่ JSON ก็ปล่อยผ่าน hourIso = undefined → auto
    hourIso = undefined;
  }

  // ✳️ เรียก queue ให้ worker ไปทำงานต่อ
  //   - ถ้าไม่มี hourIso = ให้ worker ตัดสินใจเอง (auto = current/previous hour)
  //   - ถ้ามี hourIso = บังคับ rollup ชม.นั้น (ที่คุณ loop ยิงไปทีละชั่วโมง)
  const job = await enqueueRollupHourlyJob(
    hourIso ? { hourIso } : undefined
  );

  return NextResponse.json({
    ok: true,
    queued: true,
    hourIso: hourIso ?? "auto",
    jobId: job?.id ?? null,
  });
}

// ----- Handler สำหรับ POST (หลักที่ใช้จริง) -----
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    return await handleRollup(req);
  } catch (err) {
    console.error("[cron/rollup-hourly] error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}

// ----- เพิ่ม GET เผื่อ Vercel Cron เรียกแบบ GET -----
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  try {
    return await handleRollup(req);
  } catch (err) {
    console.error("[cron/rollup-hourly] error:", err);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
