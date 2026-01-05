// app/contact/ContactForm.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Mail, User, Send, AlertTriangle, CheckCircle2 } from "lucide-react";

type FormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

type DoneState = null | "ok" | "err" | "queued";

function isEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export default function ContactForm() {
  const [v, setV] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<DoneState>(null);
  const [err, setErr] = useState<string | null>(null);

  // anti-bot
  const [startedAt, setStartedAt] = useState<number>(Date.now());
  const [hp, setHp] = useState<string>(""); // honeypot (must remain empty)

  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  const set = (k: keyof FormState, value: string) =>
    setV((p) => ({ ...p, [k]: value }));

  const fieldErrors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {};

    if (!v.name.trim()) e.name = "Please enter your name.";
    if (!v.email.trim()) e.email = "Please enter your email.";
    else if (!isEmail(v.email)) e.email = "Please enter a valid email address.";

    if (!v.subject.trim()) e.subject = "Please enter a subject.";
    if (!v.message.trim()) e.message = "Please enter your message.";
    else if (v.message.trim().length < 10) e.message = "Message looks too short (min 10 chars).";

    return e;
  }, [v]);

  const canSubmit = useMemo(() => {
    return (
      !sending &&
      !hp && // honeypot must be empty
      Object.keys(fieldErrors).length === 0
    );
  }, [sending, hp, fieldErrors]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(null);
    setErr(null);

    // client-side guard
    if (!canSubmit) {
      setDone("err");
      setErr("Please fix the highlighted fields.");
      return;
    }

    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ ...v, startedAt, hp }),
      });

      const json = (await res.json()) as { ok: boolean; error?: string };

      if (!json.ok) throw new Error(json.error || "Send failed");

      // API may return 202 when queued/preview mode
      setDone(res.status === 202 ? "queued" : "ok");

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

  const inputBase =
    "mt-1 w-full rounded-2xl bg-slate-950/30 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-sky-500/60 focus:ring-2 focus:ring-sky-500/20 transition";

  const labelBase = "text-xs text-slate-400";

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {/* honeypot: hidden from real users/AT */}
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
          <label htmlFor="contact-name" className={labelBase}>
            Name
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="contact-name"
              name="name"
              autoComplete="name"
              className={`${inputBase} pl-11 ${
                fieldErrors.name ? "border-rose-600/60 focus:border-rose-500/70 focus:ring-rose-500/20" : ""
              }`}
              value={v.name}
              onChange={(e) => set("name", e.target.value)}
              required
              placeholder="Your name"
              title="Your full name"
            />
          </div>
          {fieldErrors.name && <p className="mt-1 text-xs text-rose-300">{fieldErrors.name}</p>}
        </div>

        <div>
          <label htmlFor="contact-email" className={labelBase}>
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              id="contact-email"
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              className={`${inputBase} pl-11 ${
                fieldErrors.email ? "border-rose-600/60 focus:border-rose-500/70 focus:ring-rose-500/20" : ""
              }`}
              value={v.email}
              onChange={(e) => set("email", e.target.value)}
              required
              placeholder="you@example.com"
              title="Your email address"
            />
          </div>
          {fieldErrors.email && <p className="mt-1 text-xs text-rose-300">{fieldErrors.email}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className={labelBase}>
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          className={`${inputBase} ${
            fieldErrors.subject ? "border-rose-600/60 focus:border-rose-500/70 focus:ring-rose-500/20" : ""
          }`}
          value={v.subject}
          onChange={(e) => set("subject", e.target.value)}
          required
          placeholder="How can we help?"
          title="Subject"
        />
        {fieldErrors.subject && <p className="mt-1 text-xs text-rose-300">{fieldErrors.subject}</p>}
      </div>

      <div>
        <label htmlFor="contact-message" className={labelBase}>
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          className={`${inputBase} min-h-[160px] ${
            fieldErrors.message ? "border-rose-600/60 focus:border-rose-500/70 focus:ring-rose-500/20" : ""
          }`}
          value={v.message}
          onChange={(e) => set("message", e.target.value)}
          required
          placeholder="Tell us more about your request…"
          title="Message"
        />
        {fieldErrors.message && <p className="mt-1 text-xs text-rose-300">{fieldErrors.message}</p>}
      </div>

      {done === "ok" && (
        <div className="rounded-2xl border border-emerald-700/40 bg-emerald-900/20 px-4 py-3 text-sm text-emerald-200 flex items-start gap-2">
          <CheckCircle2 className="h-4 w-4 mt-0.5" />
          <div>Message sent. We’ll get back soon.</div>
        </div>
      )}

      {done === "queued" && (
        <div className="rounded-2xl border border-amber-700/40 bg-amber-900/20 px-4 py-3 text-sm text-amber-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>Message received (queued/preview). We’ll verify mail settings and follow up.</div>
        </div>
      )}

      {done === "err" && (
        <div className="rounded-2xl border border-rose-700/40 bg-rose-900/20 px-4 py-3 text-sm text-rose-200 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <div>{err || "Failed to send."}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <Button
          disabled={!canSubmit}
          className="rounded-2xl px-5"
          type="submit"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
