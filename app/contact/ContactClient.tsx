// app/contact/ContactClient.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";

type FormState = "idle" | "submitting" | "success" | "error";

export default function ContactClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<FormState>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [fieldErr, setFieldErr] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("submitting");
    setErr(null);
    setFieldErr({});

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ name, email, message, website })
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setErr(data?.error || "Failed to send");
        setFieldErr(data?.errors || {});
        return;
      }
      setState("success");
      setName("");
      setEmail("");
      setMessage("");
      setWebsite("");
    } catch (e: any) {
      setState("error");
      setErr(e?.message || "Network error");
    }
  };

  return (
    <main className="p-6 text-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-3xl font-semibold">Contact us</h1>
          <p className="text-slate-400 mt-2">
            Questions, partnerships, or feedback — we’d love to hear from you.
          </p>
        </header>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6">
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-slate-300">Name</label>
                  <input
                    className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                  />
                  {fieldErr.name && <p className="text-xs text-rose-400 mt-1">{fieldErr.name}</p>}
                </div>
                <div>
                  <label className="block text-sm text-slate-300">Email</label>
                  <input
                    type="email"
                    className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane@example.com"
                  />
                  {fieldErr.email && <p className="text-xs text-rose-400 mt-1">{fieldErr.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300">Message</label>
                <textarea
                  className="mt-1 w-full min-h-[140px] rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm text-slate-200"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us a bit about your request…"
                />
                {fieldErr.message && <p className="text-xs text-rose-400 mt-1">{fieldErr.message}</p>}
              </div>

              {/* honeypot (ซ่อนจากผู้ใช้จริง) */}
              <div className="hidden">
                <label htmlFor="website" className="sr-only">Website</label>
                <input
                  id="website"
                  name="website"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  aria-hidden="true"
                  tabIndex={-1}
                />
              </div>

              {state === "error" && err && (
                <div className="rounded-xl border border-rose-800 bg-rose-950/40 px-3 py-2 text-sm text-rose-200">
                  {err}
                </div>
              )}
              {state === "success" && (
                <div className="rounded-xl border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  Thank you — we’ve received your message.
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button className="rounded-2xl px-5" type="submit" disabled={state === "submitting"}>
                  {state === "submitting" ? "Sending…" : "Send message"}
                </Button>

                <a href="mailto:hello@solink.network" className="text-sm text-sky-300 hover:underline">
                  or email us directly
                </a>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
