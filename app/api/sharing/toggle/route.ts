// app/api/sharing/toggle/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/sharing/toggle
 * body: { address: string; active: boolean }
 *
 * ใช้เปิด/ปิดสถานะ sharing ของ wallet ปัจจุบัน
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies();

    const auth = cookieStore.get("solink_auth")?.value;
    if (!auth) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // ---- อ่าน JSON body แบบปลอดภัย ----
    let payload: any = null;
    try {
      payload = await req.json();
    } catch {
      payload = null;
    }

    const address: string | undefined =
      payload?.address ?? payload?.wallet ?? undefined;
    const active: boolean | undefined =
      typeof payload?.active === "boolean"
        ? payload.active
        : payload?.active === "true"
        ? true
        : payload?.active === "false"
        ? false
        : undefined;

    if (!address) {
      return NextResponse.json(
        { ok: false, error: "Missing wallet address" },
        { status: 400 }
      );
    }

    if (typeof active === "undefined") {
      return NextResponse.json(
        { ok: false, error: "Missing active flag" },
        { status: 400 }
      );
    }

    // upsert ตาม wallet
    const sharing = await prisma.sharingState.upsert({
      where: { wallet: address },
      update: {
        active,
        updatedAt: new Date(),
      },
      create: {
        wallet: address,
        active,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        active: sharing.active,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("sharing toggle error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
