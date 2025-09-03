// app/settings/page.tsx
import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Settings — Solink",
  description:
    "Configure your Solink preferences such as theme, timezone, currency, and units.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl p-6" translate="no">
      <Reveal>
        <header>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-2">
            Personalize your experience — theme, timezone, currency, and more.
          </p>
        </header>
      </Reveal>

      <Reveal delay={0.06}>
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
          {/* Client component that handles form state, saving, and instant preview */}
          <SettingsClient />
        </section>
      </Reveal>
    </main>
  );
}
