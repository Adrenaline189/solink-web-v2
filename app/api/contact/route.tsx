// app/api/contact/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEN = { name: 100, email: 200, subject: 140, message: 5000 };
const MIN_FILL_SECONDS = 3;
const RATE_LIMIT_WINDOW = 60;
const RATE_LIMIT_MAX = 5;

const buckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(ip: string): boolean {
  const now = Date.now();
  const b = buckets.get(ip);
  if (!b || now > b.resetAt) {
    buckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW * 1000 });
    return true;
  }
  if (b.count >= RATE_LIMIT_MAX) return false;
  b.count++;
  return true;
}

function isValidEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(req: Request) {
  try {
    const ip =
      (req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        "0.0.0.0");

    if (!rateLimit(ip)) {
      return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim();
    const subject = String(body.subject ?? "").trim();
    const message = String(body.message ?? "").trim();

    // honeypot + timing (เฉพาะเมื่อ startedAt ส่งมาและเป็นตัวเลข)
    const hp = String(body.hp ?? "");
    const startedAtNum = Number(body.startedAt);
    const hasTs = Number.isFinite(startedAtNum);
    const tookMs = hasTs ? Date.now() - startedAtNum : Number.POSITIVE_INFINITY;

    if (hp.length > 0 || (hasTs && tookMs < MIN_FILL_SECONDS * 1000)) {
      return NextResponse.json({ ok: true }, { status: 202 });
    }

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }
    if (
      name.length > MAX_LEN.name ||
      email.length > MAX_LEN.email ||
      subject.length > MAX_LEN.subject ||
      message.length > MAX_LEN.message
    ) {
      return NextResponse.json({ ok: false, error: "Content too long" }, { status: 400 });
    }

    const {
      MAIL_HOST,
      MAIL_PORT,
      MAIL_USER,
      MAIL_PASS,
      MAIL_FROM = "Solink IR <ir@solink.network>",
    } = process.env as Record<string, string | undefined>;
    const MAIL_TO = process.env.MAIL_TO ?? "ir@solink.network";

    if (MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS) {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host: MAIL_HOST,
        port: Number(MAIL_PORT),
        secure: Number(MAIL_PORT) === 465,
        auth: { user: MAIL_USER, pass: MAIL_PASS },
      });

      const text =
        `New contact from ${name} <${email}>\n` +
        `Subject: ${subject}\n\n` +
        `${message}\n\n` +
        `IP: ${ip}\nUser-Agent: ${req.headers.get("user-agent") || "-"}`;

      await transporter.sendMail({
        from: MAIL_FROM,
        to: MAIL_TO,
        subject: `[Contact] ${subject}`,
        replyTo: email,
        text,
      });

      return NextResponse.json({ ok: true });
    } else {
      // ยังไม่ตั้งค่า SMTP — log preview ไว้เพื่อทดสอบ
      console.log("[contact] preview", { name, email, subject, message, ip, to: MAIL_TO });
      return NextResponse.json({ ok: true }, { status: 202 });
    }
  } catch (e) {
    console.error("[contact] error", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
