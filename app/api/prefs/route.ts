// app/api/prefs/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { DEFAULT_PREFS, sanitizePrefs, type Preferences } from "@/lib/prefs";

export const dynamic = "force-dynamic";
const COOKIE = "solink_prefs";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export async function GET() {
  try {
    const raw = cookies().get(COOKIE)?.value;
    // ใช้ undefined (ไม่ใช่ null) ให้ตรงกับ signature ของ sanitizePrefs
    const parsed: Partial<Preferences> | undefined = raw
      ? (JSON.parse(raw) as Partial<Preferences>)
      : undefined;

    const prefs = sanitizePrefs(parsed);
    return NextResponse.json(
      { ok: true, prefs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: true, prefs: DEFAULT_PREFS },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => ({}))) as Partial<Preferences>;
    const prefs = sanitizePrefs(body);

    const res = NextResponse.json(
      { ok: true, prefs },
      { headers: { "Cache-Control": "no-store" } }
    );

    res.cookies.set({
      name: COOKIE,
      value: JSON.stringify(prefs),
      maxAge: MAX_AGE,
      path: "/",
      sameSite: "lax",
      httpOnly: false, // ให้ client อ่านได้หากต้องการ
      secure: process.env.NODE_ENV === "production", // โปรดใช้ HTTPS ในโปรดักชัน
    });

    return res;
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid payload" },
      { status: 400 }
    );
  }
}
