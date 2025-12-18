// app/api/sharing/toggle/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

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

    const wallet = cookieStore.get("solink_wallet")?.value?.trim();
    if (!wallet) {
      return NextResponse.json({ ok: false, error: "No wallet" }, { status: 400 });
    }

    // body optional: { active: boolean }
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const forcedActive =
      typeof body?.active === "boolean" ? body.active : undefined;

    // ensure user exists (optional แต่ดี)
    await prisma.user.upsert({
      where: { wallet },
      update: {},
      create: { wallet },
    });

    const existing = await prisma.sharingState.findUnique({
      where: { wallet },
      select: { active: true },
    });

    const current = !!existing?.active;
    const next = forcedActive ?? !current;

    await prisma.sharingState.upsert({
      where: { wallet },
      update: { active: next },
      create: { wallet, active: next },
    });

    return NextResponse.json({ ok: true, active: next }, { status: 200 });
  } catch (e: any) {
    console.error("[sharing/toggle] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
