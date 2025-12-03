// app/api/sharing/toggle/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { address, active } = body as {
      address?: string;
      active?: boolean;
    };

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { ok: false, error: "Missing wallet address" },
        { status: 400 }
      );
    }

    if (typeof active !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid 'active' flag" },
        { status: 400 }
      );
    }

    // ต้องมี cookie login จาก /api/auth/login ก่อน
    const authCookie = cookies().get("solink_auth")?.value;
    if (!authCookie) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // ensure user มีอยู่ในระบบ (ถ้ายังไม่มีให้สร้าง)
    let user = await prisma.user.findUnique({
      where: { wallet: address },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { wallet: address },
      });
    }

    // ✅ upsert เฉพาะ field ที่มีใน schema จริง ๆ: wallet + active
    const sharing = await prisma.sharingState.upsert({
      where: { wallet: address },
      update: {
        active,
      },
      create: {
        wallet: address,
        active,
      },
    });

    return NextResponse.json({
      ok: true,
      active: sharing.active,
    });
  } catch (err: any) {
    console.error("toggle sharing error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: err?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
