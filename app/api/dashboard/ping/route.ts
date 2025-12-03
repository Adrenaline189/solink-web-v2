// app/api/dashboard/ping/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  // ตัวนี้ไม่ต้องทำอะไรเยอะ แค่ตอบ ok
  // latency จะไปคำนวณฝั่ง browser จากเวลา round-trip
  return NextResponse.json({
    ok: true,
    ts: Date.now(),
  });
}
