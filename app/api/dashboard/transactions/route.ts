import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

export const dynamic = "force-dynamic";

/* --------------------------- helpers --------------------------- */
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

/** แปลง Date → "YYYY-MM-DD HH:mm UTC" */
function fmtUTC(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/** แปลงค่าที่อาจเป็น BigInt/null → number ปลอดภัย */
function toNum(v: any): number {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}

/** จำกัดค่า range ให้อยู่ในชุดที่อนุญาต */
function normalizeRange(raw: string | null): DashboardRange {
  const v = (raw ?? "today").toLowerCase();
  return v === "7d" || v === "30d" || v === "today" ? v : "today";
}

/* ----------------------------- GET ----------------------------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const _range = normalizeRange(searchParams.get("range")); // เผื่ออนาคต
    const limitRaw = searchParams.get("limit");
    const limit = Math.min(Number(limitRaw) || 50, 200); // default 50, max 200

    const rows = await prisma.pointEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { createdAt: true, type: true, amount: true, meta: true },
    });

    const tx = rows.map((r) => {
      const note =
        typeof r.meta === "object" && r.meta && "note" in (r.meta as any)
          ? String((r.meta as any).note)
          : "";
      return {
        ts: fmtUTC(new Date(r.createdAt)),
        type: String(r.type),
        amount: toNum(r.amount),
        note,
      };
    });

    return NextResponse.json(tx, {
      headers: {
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 },
    );
  }
}
