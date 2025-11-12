import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { cache } from "react";

// 👉 ใช้ cache() เพื่อช่วยลดโหลด DB (optional)
export const revalidate = 60; // 1 minute cache (ISR)

export const GET = cache(async () => {
  try {
    const todayUtc = new Date(Date.UTC(
      new Date().getUTCFullYear(),
      new Date().getUTCMonth(),
      new Date().getUTCDate()
    ));

    // ดึงข้อมูลรายวัน (system)
    const daily = await prisma.metricsDaily.findUnique({
      where: {
        dayUtc_userId_unique: {
          dayUtc: todayUtc,
          userId: "system",
        },
      },
      select: {
        dayUtc: true,
        pointsEarned: true,
      },
    });

    // ดึงข้อมูลรายชั่วโมง (system)
    const hourly = await prisma.metricsHourly.findMany({
      where: {
        userId: "system",
        hourUtc: { gte: todayUtc },
      },
      orderBy: { hourUtc: "asc" },
      select: {
        hourUtc: true,
        pointsEarned: true,
      },
    });

    return NextResponse.json({
      ok: true,
      daily: daily ?? null,
      hourly,
    });
  } catch (e: any) {
    console.error("metrics api error:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Internal Server Error" },
      { status: 500 }
    );
  }
});
