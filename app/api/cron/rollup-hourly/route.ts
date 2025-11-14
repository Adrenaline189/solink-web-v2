import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const API_BASE =
  process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api-solink.network";

export async function POST(req: NextRequest) {
  const headerKey = req.headers.get("x-cron-key");
  const envKey = process.env.CRON_KEY;
  const vercelCron = req.headers.get("x-vercel-cron");

  const isAuthorized =
    (!!envKey && headerKey === envKey) ||
    vercelCron === "1";

  // ป้องกันไม่ให้ใครก็ได้มาเรียก endpoint นี้
  if (!isAuthorized) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  if (!API_BASE) {
    return NextResponse.json(
      { ok: false, error: "API_BASE not configured" },
      { status: 500 },
    );
  }

  const upstreamUrl = `${API_BASE.replace(/\/$/, "")}/cron/rollup-hourly`;

  try {
    // fire-and-forget queue ไปที่ API จริง
    const res = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(envKey ? { "x-cron-key": envKey } : {}),
      },
      body: JSON.stringify({ hourIso: "auto" }),
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "upstream_error",
          status: res.status,
          body: json ?? null,
        },
        { status: 500 },
      );
    }

    // ฝั่ง API ปกติจะตอบประมาณนี้:
    // { ok: true, queued: true, hourIso: "auto" }
    return NextResponse.json(json ?? { ok: true, queued: true, hourIso: "auto" });
  } catch (err) {
    console.error("[cron][rollup-hourly] error:", err);
    return NextResponse.json(
      { ok: false, error: "fetch_failed" },
      { status: 500 },
    );
  }
}

export function GET() {
  // กันคนมาลองเปิดด้วย browser เฉย ๆ
  return NextResponse.json({
    ok: true,
    message: "Use POST (Vercel Cron or X-CRON-KEY)",
  });
}
