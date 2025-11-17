// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth";

/**
 * คืนข้อมูล user ที่ล็อกอินจาก cookie `solink_auth`
 * ถ้าไม่มี / token ไม่ถูกต้อง → { ok: false, user: null }
 */
export async function GET(req: NextRequest) {
  try {
    const ctx = await getAuthContext(req);

    if (!ctx) {
      return NextResponse.json({
        ok: false,
        user: null,
      });
    }

    return NextResponse.json({
      ok: true,
      user: {
        wallet: ctx.wallet,
      },
    });
  } catch (err) {
    console.error("auth/me error:", err);
    return NextResponse.json(
      { ok: false, user: null },
      { status: 500 }
    );
  }
}
