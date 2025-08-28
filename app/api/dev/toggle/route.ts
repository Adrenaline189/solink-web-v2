// app/api/dev/toggle/route.ts
import { NextResponse } from "next/server";
import { resetSim } from "@/lib/dev-sim";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE = "solink_sim";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { enable?: boolean; reset?: boolean };
  const enable = Boolean(body.enable);
  const reset  = Boolean(body.reset);

  const res = NextResponse.json({ ok: true, enabled: enable });
  res.cookies.set({
    name: COOKIE,
    value: enable ? "1" : "0",
    path: "/",
    sameSite: "lax",
    httpOnly: false,
    secure: true,
    maxAge: 60 * 60 * 24 * 7 // 7 วัน
  });

  if (enable && reset) resetSim();
  if (!enable) resetSim(); // ปิดเมื่อไรก็รีเซ็ต

  return res;
}
