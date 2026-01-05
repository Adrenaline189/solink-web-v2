// app/api/contact/route.ts
import { NextResponse } from "next/server";
import { Resend } from "resend";

export const runtime = "nodejs"; // Resend ต้องใช้ node runtime (ห้าม edge)

type BodyA = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  startedAt?: number; // anti-bot timing (optional)
  hp?: string;        // honeypot (optional)
};

type BodyB = {
  name?: string;
  email?: string;
  message?: string;
  website?: string;   // honeypot (optional)
};

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;

    // ควรตั้งใน env ให้ชัดเจน
    // CONTACT_TO_EMAIL=ir@solink.network
    // CONTACT_FROM_EMAIL=contact@solink.network   <-- ต้องเป็นโดเมนที่ verify แล้ว
    const to = (process.env.CONTACT_TO_EMAIL || "ir@solink.network").trim();
    const from = (process.env.CONTACT_FROM_EMAIL || "contact@solink.network").trim();

    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Missing RESEND_API_KEY in env" },
        { status: 500 }
      );
    }

    const raw = (await req.json().catch(() => ({}))) as (BodyA & BodyB);

    // รองรับทั้ง 2 ฟอร์ม
    const name = (raw.name || "").trim();
    const email = (raw.email || "").trim();
    const subject = (raw.subject || "Contact request").trim();
    const message = (raw.message || "").trim();

    // honeypot: มี 2 ชื่อ field (hp, website)
    const honeypot = (raw.hp ?? raw.website ?? "").trim();

    // anti-bot timing:
    // - ถ้า client ส่ง startedAt มา ค่อยตรวจ "กรอกเร็วเกิน 1.2s"
    // - ถ้าไม่ส่งมา ให้ข้ามกติกานี้ (ไม่งั้นจะ queued ตลอด)
    const hasStartedAt = typeof raw.startedAt === "number" && Number.isFinite(raw.startedAt);
    const startedAt = hasStartedAt ? (raw.startedAt as number) : null;
    const elapsedMs = startedAt ? Date.now() - startedAt : null;

    // ---- Basic validation ----
    const errors: Record<string, string> = {};
    if (!name) errors.name = "Name is required";
    if (!email) errors.email = "Email is required";
    else if (!isEmail(email)) errors.email = "Email is invalid";

    // subject optional: validate เบา ๆ เฉพาะกรณีส่ง subject field มา
    if (raw.subject !== undefined && subject.length < 2) errors.subject = "Subject is too short";

    if (!message) errors.message = "Message is required";
    if (message && message.length < 10) errors.message = "Message is too short";

    if (Object.keys(errors).length) {
      return NextResponse.json({ ok: false, error: "Validation failed", errors }, { status: 400 });
    }

    // ---- Anti-bot rules ----
    if (honeypot) {
      // บอทมักกรอกช่องที่ซ่อนไว้
      return NextResponse.json({ ok: true, queued: true }, { status: 202 });
    }

    if (elapsedMs !== null && elapsedMs < 1200) {
      // กรอกเร็วผิดปกติ (เฉพาะเมื่อ client ส่ง startedAt มาจริง)
      return NextResponse.json({ ok: true, queued: true }, { status: 202 });
    }

    // ---- Email content ----
    const resend = new Resend(apiKey);
console.log("[contact] from=", from, "to=", to, "hasKey=", !!apiKey);

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeSubject = escapeHtml(subject);
    const safeMessage = escapeHtml(message).replaceAll("\n", "<br/>");

    const html = `
      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; line-height:1.6">
        <h2 style="margin:0 0 12px">New contact message</h2>
        <div style="padding:12px; border:1px solid #e5e7eb; border-radius:12px;">
          <p style="margin:0 0 8px"><b>Name:</b> ${safeName}</p>
          <p style="margin:0 0 8px"><b>Email:</b> ${safeEmail}</p>
          <p style="margin:0 0 8px"><b>Subject:</b> ${safeSubject}</p>
          <p style="margin:0"><b>Message:</b><br/>${safeMessage}</p>
        </div>
        <p style="margin:12px 0 0; color:#6b7280; font-size:12px">
          Sent via Solink contact form
        </p>
      </div>
    `.trim();

    const text =
      `New contact message\n\n` +
      `Name: ${name}\n` +
      `Email: ${email}\n` +
      `Subject: ${subject}\n\n` +
      `${message}\n`;

    // สำคัญ: from ต้องเป็นอีเมลโดเมนที่ verify แล้ว เช่น contact@solink.network
    // replyTo ใช้ camelCase (SDK รองรับ)
    const result = await resend.emails.send({
      from: `Solink Contact <${from}>`,
      to,
      replyTo: `${name} <${email}>`,
      subject: `[Solink] ${subject}`,
      html,
      text,
    });

    if ((result as any)?.error) {
      return NextResponse.json(
        { ok: false, error: (result as any).error?.message || "Resend failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
