import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

export const dynamic = "force-dynamic";

/* --------------------------- helpers --------------------------- */
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function fmtUTC(d: Date) {
  // YYYY-MM-DD HH:mm UTC  (แสดงชัดว่าเป็นเวลา UTC)
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}
function toNum(v: any): number {
  if (typeof v === "bigint") return Number(v);
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
function normalizeRange(raw: string | null): DashboardRange {
  const v = (raw ?? "today").toLowerCase();
  return (v === "7d" || v === "30d" || v === "today") ? v : "today";
}

/* ----------------------------- GET ----------------------------- */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // ตอนนี้ยังไม่ได้ใช้ range จริง แต่ normalize ไว้เผื่ออนาคต
    const _range = normalizeRange(searchParams.get("range"));

    const rows = await prisma.pointEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50, // ปรับจำนวนได้ตามต้องการ
      select: { createdAt: true, type: true, amount: true, meta: true },
    });

    const tx = rows.map((r) => {
      const note =
        (typeof r.meta === "object" && r.meta && "note" in (r.meta as any))
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
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 },
    );
  }
}
