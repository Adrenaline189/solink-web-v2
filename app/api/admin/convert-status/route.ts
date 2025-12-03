// app/api/admin/convert-status/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const SYSTEM_USER_ID = "system";
const CONVERT_KEY = "convert_enabled";

/**
 * GET /api/admin/convert-status
 *
 * อ่านสถานะเปิด/ปิดการ Convert points → SLK (global)
 * อ้างอิงจากตาราง Setting โดยใช้
 *   userId = "system"
 *   key    = "convert_enabled"
 *
 * response:
 *   { ok: true, enabled: boolean }
 */
export async function GET() {
  try {
    const setting = await prisma.setting.findUnique({
      where: {
        userId_key: {
          userId: SYSTEM_USER_ID,
          key: CONVERT_KEY,
        },
      },
    });

    // ถ้ายังไม่มีค่าใน DB ให้ default = true หรืออ่านจาก ENV ก็ได้
    const enabled =
      setting?.value != null
        ? setting.value === "true"
        : process.env.CONVERT_ENABLED !== "false";

    return NextResponse.json(
      {
        ok: true,
        enabled,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("convert-status GET error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/convert-status
 *
 * body: { enabled: boolean }
 * ใช้สำหรับ admin toggle เปิด/ปิดการ convert
 *
 * response:
 *   { ok: true, enabled: boolean }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { enabled } = body as { enabled?: boolean };

    if (typeof enabled !== "boolean") {
      return NextResponse.json(
        {
          ok: false,
          error: "Missing 'enabled' boolean in body",
        },
        { status: 400 }
      );
    }

    const value = enabled ? "true" : "false";

    await prisma.setting.upsert({
      where: {
        userId_key: {
          userId: SYSTEM_USER_ID,
          key: CONVERT_KEY,
        },
      },
      update: {
        value,
      },
      create: {
        userId: SYSTEM_USER_ID,
        key: CONVERT_KEY,
        value,
      },
    });

    return NextResponse.json(
      {
        ok: true,
        enabled,
      },
      { status: 200 }
    );
  } catch (e: any) {
    console.error("convert-status POST error:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
