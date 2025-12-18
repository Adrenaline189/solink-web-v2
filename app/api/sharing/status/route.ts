// app/api/sharing/status/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = cookies();

    const auth = cookieStore.get("solink_auth")?.value;
    if (!auth) {
      return NextResponse.json(
        { ok: true, active: false, reason: "Not authenticated" },
        { status: 200 }
      );
    }

    const wallet = cookieStore.get("solink_wallet")?.value?.trim();
    if (!wallet) {
      return NextResponse.json(
        { ok: true, active: false, reason: "No wallet" },
        { status: 200 }
      );
    }

    const row = await prisma.sharingState.findUnique({
      where: { wallet },
      select: { active: true },
    });

    return NextResponse.json({ ok: true, active: !!row?.active }, { status: 200 });
  } catch (e: any) {
    console.error("[sharing/status] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
