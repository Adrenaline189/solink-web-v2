import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Range } from "@/lib/data/dashboard";

export const dynamic = "force-dynamic";

function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = (searchParams.get("range") as Range) || "today";

    if (range !== "today") {
      // simple stub; upgrade later
      return NextResponse.json([], { headers: { "cache-control": "no-store" } });
    }

    const since = startOfTodayUTC();
    const events = await prisma.pointEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    const bucket = new Map<string, number>();
    for (const e of events) {
      const d = e.createdAt;
      const label = `${pad(d.getUTCHours())}:00`;
      bucket.set(label, (bucket.get(label) ?? 0) + e.amount);
    }

    const labels = Array.from({ length: 24 }, (_, h) => `${pad(h)}:00`);
    const data = labels.map((label) => ({
      time: label,
      points: bucket.get(label) ?? 0,
      mbps: undefined,
    }));

    return NextResponse.json(data, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "internal error" }, { status: 500 });
  }
}
