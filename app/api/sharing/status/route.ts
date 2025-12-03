// app/api/sharing/status/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/sharing/status
 *
 * ใช้เช็คสถานะปุ่ม Start/Stop Sharing ของ wallet ปัจจุบัน
 * - ต้องมี cookie `solink_auth` (ถูกเซ็ตจาก /api/auth/login ตอน connect wallet)
 * - ใช้ cookie `solink_wallet` เพื่อรู้ว่าเป็น wallet ไหน
 * - ตอบกลับ { ok: true, active: boolean, reason?: string }
 */
export async function GET(req: Request) {
  try {
    const cookieStore = cookies();

    const auth = cookieStore.get("solink_auth")?.value;
    if (!auth) {
      // ยังไม่ login → ถือว่า Paused ไปก่อน
      return NextResponse.json(
        {
          ok: true,
          active: false,
          reason: "Not authenticated",
        },
        { status: 200 }
      );
    }

    const wallet = cookieStore.get("solink_wallet")?.value;
    if (!wallet) {
      return NextResponse.json(
        {
          ok: true,
          active: false,
          reason: "No wallet cookie",
        },
        { status: 200 }
      );
    }

    // ยืนยันว่ามี user จริงในระบบ
    const user = await prisma.user.findFirst({
      where: { wallet },
    });

    if (!user) {
      return NextResponse.json(
        {
          ok: true,
          active: false,
          reason: "User not found",
        },
        { status: 200 }
      );
    }

    // อ่าน SharingState ตาม wallet (unique)
    const sharing = await prisma.sharingState.findUnique({
      where: { wallet },
    });

    const active = !!sharing?.active;

    return NextResponse.json(
      {
        ok: true,
        active,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("[sharing/status] error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
