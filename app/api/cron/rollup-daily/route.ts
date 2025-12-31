// app/api/cron/rollup-daily/route.ts
import { NextResponse } from "next/server";
import { rollupDay } from "@/server/rollup/rollup-day";

export const runtime = "nodejs";

function requireCronKey(req: Request) {
  const got = req.headers.get("x-cron-key") || "";
  const want = process.env.CRON_KEY || "";
  if (!want) return { ok: false as const, error: "Missing CRON_KEY in env" };
  if (got !== want) return { ok: false as const, error: "Unauthorized" };
  return { ok: true as const };
}

// parse ISO date string safely
function parseDayParam(s: string | null): Date | null {
  if (!s) return null;
  const d = new Date(s);
  if (!Number.isFinite(d.getTime())) return null;
  return d;
}

export async function POST(req: Request) {
  try {
    const auth = requireCronKey(req);
    if (!auth.ok) {
      return NextResponse.json({ ok: false, error: auth.error }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);

    // ถ้าใส่ ?day=2025-12-24T00:00:00.000Z จะ rollup วันนั้น
    // ถ้าไม่ใส่ -> rollup "เมื่อวาน (UTC)"
    const dayParam = parseDayParam(searchParams.get("day"));

    const now = new Date();
    const target = dayParam ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const res = await rollupDay(target);

    return NextResponse.json({
      ok: true,
      dayUtc: res.dayUtc.toISOString(),
      users: res.users,
    });
  } catch (e: any) {
    console.error("[cron/rollup-daily] error:", e);
    return NextResponse.json({ ok: false, error: e?.message || "Internal error" }, { status: 500 });
  }
}
