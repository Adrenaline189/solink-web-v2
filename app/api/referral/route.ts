// app/api/referral/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { REF_COOKIE_NAME, parseRefCookie } from "@/lib/referral";

export const dynamic = "force-dynamic";

export async function GET() {
  const raw = cookies().get(REF_COOKIE_NAME)?.value || null;
  const ref = parseRefCookie(raw);
  return NextResponse.json({ ok: true, ref }, { headers: { "Cache-Control": "no-store" } });
}
