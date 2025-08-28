"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ContactForm() {
  const [v, setV] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<null | "ok" | "err" | "queued">(null);
  const [err, setErr] = useState<string | null>(null);

  // anti-bot
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [hp, setHp] = useState<string>(""); // honeypot: ผู้ใช้จริงปล่อยว่าง

  useEffect(() => {
    // ตั้งเวลาเริ่มกรอกเมื่อคอมโพเนนต์ mount
    setStartedAt(Date.now());
  }, []);

  const set = (k: keyof FormState, value: string) =>
    setV((p) => ({ ...p, [k]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setDone(null);
    setErr(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...v, startedAt, hp }),
      });

      const json = (await res.json()) as { ok: boolean; error?: string };
      if (!json.ok) {
        throw new Error(json.error || "Send failed");
      }

      // API อาจตอบ 202 เมื่อโดน anti-bot หรือยังไม่ตั้งค่า SMTP (preview)
      if (res.status === 202) {
        setDone("queued");
      } else {
        setDone("ok");
      }

      setV({ name: "", email: "", subject: "", message: "" });
      setStartedAt(Date.now());
      setHp("");
    } catch (e: any) {
      setDone("err");
      setErr(e?.message || "Send failed");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* honeypot: ซ่อนไว้จากผู้ใช้จริง/AT */}
      <div aria-hidden="true" className="sr-only">
        <label htmlFor="contact-hp">Leave this field empty</label>
        <input
          id="contact-hp"
          name="hp"
          autoComplete="off"
          tabIndex={-1}
          value={hp}
          onChange={(e) => setHp(e.target.value)}
          placeholder="Do not fill"
          title="Do not fill"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="text-sm text-slate-400">
            Name
          </label>
          <input
            id="contact-name"
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
            value={v.name}
            onChange={(e) => set("name", e.target.value)}
            required
            placeholder="Your name"
            title="Your full name"
          />
        </div>

        <div>
          <label htmlFor="contact-email" className="text-sm text-slate-400">
            Email
          </label>
          <input
            id="contact-email"
            type="email"
            name="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
            value={v.email}
            onChange={(e) => set("email", e.target.value)}
            required
            inputMode="email"
            placeholder="you@example.com"
            title="Your email address"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="text-sm text-slate-400">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
          value={v.subject}
          onChange={(e) => set("subject", e.target.value)}
          required
          placeholder="How can we help?"
          title="Subject"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="text-sm text-slate-400">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm min-h-[140px]"
          value={v.message}
          onChange={(e) => set("message", e.target.value)}
          required
          placeholder="Tell us more about your request…"
          title="Message"
        />
      </div>

      {done === "ok" && (
        <div className="rounded-lg border border-emerald-700/50 bg-emerald-900/30 px-3 py-2 text-sm text-emerald-300">
          Message sent. We’ll get back soon.
        </div>
      )}
      {done === "queued" && (
        <div className="rounded-lg border border-amber-700/50 bg-amber-900/30 px-3 py-2 text-sm text-amber-200">
          Message received. (Queued/preview) We’ll verify mail settings and follow up.
        </div>
      )}
      {done === "err" && (
        <div className="rounded-lg border border-rose-700/50 bg-rose-900/30 px-3 py-2 text-sm text-rose-300">
          {err || "Failed to send."}
        </div>
      )}

      <Button disabled={sending} className="rounded-2xl px-5">
        {sending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
