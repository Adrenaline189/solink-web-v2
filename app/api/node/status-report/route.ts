// app/api/node/status-report/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type StatusPayload = {
  wallet?: string;           // wallet address ของ user
  walletId?: string;         // alias เผื่อใช้ชื่ออื่น
  latencyMs?: number;        // ping latency
  uptimePct?: number;        // uptime %
  avgBandwidth?: number;     // Mbps
  qfScore?: number;          // quality factor 0–100
  trustScore?: number;       // trust score 0–100
  clientVersion?: string;    // เวอร์ชัน client / extension
};

/* ---------- helpers ---------- */
function startOfUTC(date = new Date()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function getOrCreateUserId(wallet: string): Promise<string> {
  const existing = await prisma.user.findUnique({ where: { wallet } });
  if (existing) return existing.id;

  const created = await prisma.user.create({
    data: { wallet },
  });
  return created.id;
}

/* ---------- POST /api/node/status-report ---------- */

export async function POST(req: Request) {
  try {
    const payload = (await req.json().catch(() => ({}))) as StatusPayload;

    const wallet = payload.wallet || payload.walletId;
    if (!wallet) {
      return NextResponse.json(
        { ok: false, error: "wallet is required" },
        { status: 400 }
      );
    }

    const userId = await getOrCreateUserId(wallet);
    const today = startOfUTC();

    // ค่าที่ node ส่งมา
    const uptimePct =
      typeof payload.uptimePct === "number" ? payload.uptimePct : null;
    const avgBandwidth =
      typeof payload.avgBandwidth === "number" ? payload.avgBandwidth : null;
    const qfScore =
      typeof payload.qfScore === "number" ? payload.qfScore : null;
    const trustScore =
      typeof payload.trustScore === "number" ? payload.trustScore : null;

    // upsert MetricsDaily สำหรับ user วันนี้
    await prisma.metricsDaily.upsert({
      where: {
        dayUtc_userId_unique: {
          dayUtc: today,
          userId,
        },
      },
      update: {
        uptimePct: uptimePct ?? undefined,
        avgBandwidth: avgBandwidth ?? undefined,
        qfScore: qfScore ?? undefined,
        trustScore: trustScore ?? undefined,
      },
      create: {
        dayUtc: today,
        userId,
        pointsEarned: 0,
        uptimePct: uptimePct ?? undefined,
        avgBandwidth: avgBandwidth ?? undefined,
        qfScore: qfScore ?? undefined,
        trustScore: trustScore ?? undefined,
      },
    });

    // --------- เก็บ IP / Region / Client version ลง Setting ---------
    const ipRaw =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      null;
    const ip = ipRaw ? ipRaw.split(",")[0].trim() : null;

    const region =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-geo-country") ||
      null;

    const clientVersion = payload.clientVersion ?? null;
    const nowIso = new Date().toISOString();

    const settingsToUpsert: { key: string; value: string }[] = [
      { key: "status:ip", value: ip ?? "" },
      { key: "status:region", value: region ?? "" },
      { key: "status:clientVersion", value: clientVersion ?? "" },
      { key: "status:lastSeenAt", value: nowIso },
    ];

    await Promise.all(
      settingsToUpsert.map((s) =>
        prisma.setting.upsert({
          where: {
            userId_key: {
              userId,
              key: s.key,
            },
          },
          update: { value: s.value },
          create: {
            userId,
            key: s.key,
            value: s.value,
          },
        })
      )
    );

    return NextResponse.json({
      ok: true,
      userId,
      dayUtc: today.toISOString(),
    });
  } catch (e: any) {
    console.error("status-report error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "internal error" },
      { status: 500 }
    );
  }
}
