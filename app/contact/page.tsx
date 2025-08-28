// app/contact/page.tsx
import type { Metadata } from "next";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact — Solink",
  description: "Get in touch with the Solink team.",
  robots: { index: true, follow: true }
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Contact us</h1>
      <p className="text-slate-400 mb-6">
        Questions, partnership, or feedback—send us a message.
      </p>
      <ContactForm />
    </div>
  );
}
