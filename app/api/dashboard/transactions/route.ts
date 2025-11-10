import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { DashboardRange } from "@/types/dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const _range = (searchParams.get("range") as DashboardRange) || "today";

    const rows = await prisma.pointEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { createdAt: true, type: true, amount: true, meta: true },
    });

    const tx = rows.map((r) => ({
      ts: r.createdAt.toISOString().slice(0, 16).replace("T", " "),
      type: r.type,
      amount: r.amount,        // number
      note: (typeof r.meta === "object" && r.meta && "note" in r.meta ? String((r.meta as any).note) : "") || "",
    }));

    return NextResponse.json(tx, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal error" }, { status: 500 });
  }
}
