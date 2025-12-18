// app/api/admin/convert-toggle/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { requireAdmin } from "@/lib/auth";

function boolFromString(v: string | null | undefined, defaultVal = true): boolean {
  if (!v) return defaultVal;
  const x = v.toLowerCase();
  if (["1", "true", "yes", "on"].includes(x)) return true;
  if (["0", "false", "no", "off"].includes(x)) return false;
  return defaultVal;
}

const GLOBAL_KEY = "convert_enabled";

/**
 * อ่านค่า global setting (ทั้งระบบ)
 */
async function getGlobalConvertEnabled(): Promise<boolean> {
  const row = await prisma.setting.findFirst({
    where: {
      userId: null,
      key: GLOBAL_KEY,
    },
  });

  if (row && typeof row.value === "string") {
    return boolFromString(row.value, true);
  }

  // fallback ไปที่ ENV ถ้าไม่มี record ใน DB
  return boolFromString(process.env.CONVERT_ENABLED ?? "true", true);
}

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);

    const enabled = await getGlobalConvertEnabled();

    return NextResponse.json({ ok: true, enabled });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin(req);

    const body = (await req.json().catch(() => ({}))) as { enabled?: boolean };
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json(
        { ok: false, error: "enabled(boolean) required" },
        { status: 400 }
      );
    }

    const value = body.enabled ? "true" : "false";

    // ❌ เลิกใช้ upsert + userId_key (เพราะ userId เป็น null)
    // ✅ ใช้ deleteMany + create แทน
    await prisma.setting.deleteMany({
      where: {
        userId: null,
        key: GLOBAL_KEY,
      },
    });

    await prisma.setting.create({
      data: {
        userId: null,
        key: GLOBAL_KEY,
        value,
      },
    });

    return NextResponse.json({ ok: true, enabled: body.enabled });
  } catch (e: any) {
    const status = e?.status ?? 500;
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal error" },
      { status }
    );
  }
}
