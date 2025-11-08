// app/api/dashboard/hourly/route.ts
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

  const rows: Array<{ ts: Date; points: number }> = await prisma.$queryRaw`
    SELECT date_trunc('hour', "createdAt") as ts, COALESCE(SUM("amount"), 0)::int as points
    FROM "PointEvent"
    WHERE "userId" = ${user.id} AND "createdAt" BETWEEN ${start} AND ${end}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  return NextResponse.json({
    ok: true,
    data: rows.map((r) => ({ ts: r.ts.toISOString(), points: Number(r.points) })),
  });
}
