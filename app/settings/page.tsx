// app/settings/page.tsx
import type { Metadata } from "next";
import SettingsClient from "./SettingsClient";

export const metadata: Metadata = {
  title: "Settings — Solink",
  description: "Configure your Solink preferences such as theme, timezone, currency, and units.",
};

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-slate-400 mt-2">
        Personalize your experience — theme, timezone, currency, and more.
      </p>

      <div className="mt-6">
        {/* Client component that handles form state, saving, and instant preview */}
        <SettingsClient />
      </div>
    </div>
  );
}
