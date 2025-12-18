import { NextResponse } from "next/server";
import { rollupDay } from "@/server/rollup/rollup-day";

function dayStartUTC(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  const cronKey = req.headers.get("x-cron-key");
  if (!cronKey || cronKey !== process.env.CRON_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dayParam = url.searchParams.get("day");

  // default = วันก่อนหน้า (UTC)
  let dayToRoll = new Date();
  dayToRoll.setUTCDate(dayToRoll.getUTCDate() - 1);

  if (dayParam) {
    const parsed = new Date(dayParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid day param" }, { status: 400 });
    }
    dayToRoll = parsed;
  }

  const dayUtc = dayStartUTC(dayToRoll);
  const result = await rollupDay(dayUtc);

  return NextResponse.json({ ok: true, ...result });
}
