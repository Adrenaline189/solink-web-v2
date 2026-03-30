import { NextResponse } from "next/server";
import { rollupHourPoints } from "@/server/rollup/rollup-hour";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCronKey(req: Request): string {
  const h1 = req.headers.get("x-cron-key");
  const h2 = req.headers.get("X-CRON-KEY");
  const headerKey = (h1 || h2 || "").trim();
  if (headerKey) return headerKey;

  const auth = (req.headers.get("authorization") || req.headers.get("Authorization") || "").trim();
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("cronKey") || "").trim();
  if (q) return q;

  return "";
}

function requireCronKey(req: Request) {
  const got = getCronKey(req);
  const want = (process.env.CRON_KEY || "").trim();

  if (!want) return { ok: false as const, error: "Missing CRON_KEY in env" };
  if (!got) {
    return {
      ok: false as const,
      error: "Missing cron key (send header x-cron-key, Authorization Bearer, or ?cronKey=...)",
    };
  }
  if (got !== want) return { ok: false as const, error: "Unauthorized" };
  return { ok: true as const };
}

// ปัดเวลาเป็นต้นชั่วโมง UTC
function hourStartUTC(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), d.getUTCHours(), 0, 0, 0));
}

// รองรับ hour=YYYY-MM-DDTHH:00:00.000Z หรือ hour=YYYY-MM-DDTHH
function parseHourParam(s: string | null): Date | null {
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

    const url = new URL(req.url);
    const hourParam = parseHourParam(url.searchParams.get("hour"));

    // default = ชั่วโมงก่อนหน้า (UTC)
    const now = new Date();
    const prev = new Date(now.getTime() - 60 * 60 * 1000);
    const hourToRoll = hourParam ?? prev;

    const hourUtc = hourStartUTC(hourToRoll);
    const result = await rollupHourPoints(hourUtc);

    return NextResponse.json(
      {
        ok: true,
        hourUtc: result.hourUtc.toISOString(),
        users: result.users,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[cron/rollup-hourly] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
