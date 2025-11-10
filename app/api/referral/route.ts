// app/api/referral/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  // mock data: ปรับได้ตามจริง
  return NextResponse.json({
    referredCount: 0,
    bonusTotal: 0,
  });
}
