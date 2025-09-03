// app/contact/page.tsx
import type { Metadata } from "next";
import ContactForm from "./ContactForm";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Contact — Solink",
  description: "Get in touch with the Solink team.",
  robots: { index: true, follow: true },
};

export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10" translate="no">
      <Reveal>
        <header className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Contact us</h1>
          <p className="text-slate-400 mt-2">
            Questions, partnership, or feedback—send us a message.
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          <ContactForm />
        </div>
      </Reveal>
    </main>
  );
}
