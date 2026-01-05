import type { Metadata } from "next";
import Reveal from "@/components/Reveal";
import ContactForm from "./ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact — Solink",
  description: "Get in touch with the Solink team.",
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <main
      className="relative min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-16"
      translate="no"
    >
      {/* subtle background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.10]
          [background-image:linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),
          linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)]
          [background-size:56px_56px]" />
      </div>

      {/* Centered content */}
      <div className="w-full max-w-3xl">
        <Reveal>
          <header className="mb-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/40 px-3 py-1 text-xs text-slate-200">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              Fast reply • Anti-spam protected
            </div>

            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Contact Solink
            </h1>

            <p className="mt-3 text-slate-300">
              Questions, partnerships, or product feedback — send us a message and we’ll get back soon.
            </p>
          </header>
        </Reveal>

        <Reveal delay={0.06}>
          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="p-6">
              <ContactForm />
            </CardContent>
          </Card>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-4 text-center text-xs text-slate-500">
            Tip: Include your use case, expected traffic/region, and timeline for faster support.
          </div>
        </Reveal>
      </div>
    </main>
  );
}
