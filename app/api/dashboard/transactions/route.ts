// app/api/dashboard/tx/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function rangeFromNowUTC(kind: "today" | "7d" | "30d") {
  const end = new Date();
  const start = new Date(end);
  if (kind === "today") start.setUTCDate(end.getUTCDate());
  if (kind === "7d") start.setUTCDate(end.getUTCDate() - 6);
  if (kind === "30d") start.setUTCDate(end.getUTCDate() - 29);
  start.setUTCHours(0, 0, 0, 0);
  return { start, end };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet")?.trim();
  const range = (searchParams.get("range") || "today") as "today" | "7d" | "30d";
  if (!wallet) return NextResponse.json({ ok: false, error: "wallet required" }, { status: 400 });

  const user = await prisma.user.findFirst({ where: { wallet } });
  if (!user) return NextResponse.json({ ok: true, data: [] });

  const { start, end } = rangeFromNowUTC(range);

  const rows = await prisma.pointEvent.findMany({
    where: { userId: user.id, createdAt: { gte: start, lte: end } },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { createdAt: true, type: true, amount: true, meta: true },
  });

  return NextResponse.json({
    ok: true,
    data: rows.map((r) => ({
      ts: r.createdAt.toISOString(),
      type: r.type,
      amount: r.amount,
      note: typeof r.meta === "object" && r.meta && "note" in r.meta ? String((r.meta as any).note) : "",
    })),
  });
}
