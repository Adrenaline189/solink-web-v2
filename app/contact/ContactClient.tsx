// app/contact/ContactClient.tsx
"use client";

import ContactForm from "./ContactForm";
import { Card, CardContent } from "@/components/ui/card";

export default function ContactClient() {
  return (
    <main className="p-6 text-slate-100">
      <div className="mx-auto max-w-3xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold">Contact us</h1>
          <p className="text-slate-400 mt-2">
            Questions, partnerships, or feedback — we’d love to hear from you.
          </p>
        </header>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-6">
            <ContactForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
