import { NextResponse } from "next/server";
import { rollupHourPoints } from "@/server/rollup/rollup-hour";

function hourStartUTC(d: Date) {
  const x = new Date(d);
  x.setUTCMinutes(0, 0, 0);
  return x;
}

export async function POST(req: Request) {
  const cronKey = req.headers.get("x-cron-key");
  if (!cronKey || cronKey !== process.env.CRON_KEY) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const hourParam = url.searchParams.get("hour");

  // default = ชั่วโมงก่อนหน้า
  let hourToRoll = new Date();
  hourToRoll.setUTCHours(hourToRoll.getUTCHours() - 1);

  // ถ้ามี hour=... ให้ใช้ชั่วโมงนั้นแทน
  if (hourParam) {
    const parsed = new Date(hourParam);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ ok: false, error: "Invalid hour param" }, { status: 400 });
    }
    hourToRoll = parsed;
  }

  const hourUtc = hourStartUTC(hourToRoll);
  const result = await rollupHourPoints(hourUtc);

  return NextResponse.json({ ok: true, ...result });
}
