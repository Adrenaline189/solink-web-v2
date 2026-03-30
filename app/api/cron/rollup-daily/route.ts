import { NextResponse } from "next/server";
import { rollupDay } from "@/server/rollup/rollup-day";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

function getCronKey(req: Request): string {
  // 1) header x-cron-key (case-insensitive in Node, but keep both for clarity)
  const h1 = req.headers.get("x-cron-key");
  const h2 = req.headers.get("X-CRON-KEY");
  const headerKey = (h1 || h2 || "").trim();
  if (headerKey) return headerKey;

  // 2) Authorization: Bearer <key>
  const auth = (req.headers.get("authorization") || req.headers.get("Authorization") || "").trim();
  if (auth.toLowerCase().startsWith("bearer ")) {
    const token = auth.slice(7).trim();
    if (token) return token;
  }

  // 3) query ?cronKey=<key>
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

// parse ISO / YYYY-MM-DD safely
function parseDayParam(s: string | null): Date | null {
  if (!s) return null;

  // รองรับ YYYY-MM-DD (ให้เป็น UTC midnight)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00.000Z`);
    return Number.isFinite(d.getTime()) ? d : null;
  }

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

    // ?day=2026-01-06 หรือ ?day=2026-01-06T00:00:00.000Z
    // ถ้าไม่ใส่ -> default = เมื่อวาน (UTC)
    const dayParam = parseDayParam(searchParams.get("day"));

    const now = new Date();
    const target = dayParam ?? new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const res = await rollupDay(target);

    return NextResponse.json(
      {
        ok: true,
        dayUtc: res.dayUtc.toISOString(),
        users: res.users,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    console.error("[cron/rollup-daily] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
