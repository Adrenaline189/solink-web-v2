// app/settings/SettingsClient.tsx
"use client";

import { useState } from "react";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { usePrefs } from "../../lib/prefs-client";
import { TIMEZONES } from "../../lib/timezones";
import { CURRENCIES } from "../../lib/currencies";
import type { Preferences } from "../../lib/prefs";

export default function SettingsClient() {
  const { prefs, loading, setPrefs } = usePrefs();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<null | "ok" | "err">(null);

  function set<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setSaved(null);
    try {
      const res = await fetch("/api/prefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.error || "Save failed");
      if (data.prefs) setPrefs(() => data.prefs as Preferences);
      setSaved("ok");
      setTimeout(() => setSaved(null), 1500);
    } catch {
      setSaved("err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 text-slate-100">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="mb-2">
          <h1 className="text-3xl font-bold tracking-tight">Settings — Solink</h1>
          <p className="text-slate-400">Personalize your Solink experience.</p>
        </header>

        {/* Theme (ล็อก Dark) */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold">Theme</h3>
            <p className="text-slate-400 mb-3">We currently support Dark only.</p>

            <label className="flex items-center gap-2 rounded-xl border px-3 py-2 text-sm border-sky-400 bg-sky-500/10">
              <input type="radio" name="theme" checked readOnly />
              Dark
            </label>
          </CardContent>
        </Card>

        {/* Time zone */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold">Time zone</h3>
            <p className="text-slate-400 mb-3">Used for charts and timestamps.</p>

            <select
              aria-label="Time zone"
              className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
              value={prefs.tz}
              onChange={(e) => set("tz", e.target.value)}
              disabled={saving || loading}
            >
              {TIMEZONES.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.label}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Display */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardContent className="p-5">
            <h3 className="text-lg font-semibold">Display</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="text-sm text-slate-300">Currency</label>
                <select
                  id="currency"
                  className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
                  value={prefs.currency}
                  onChange={(e) => set("currency", e.target.value)}
                  disabled={saving || loading}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="units" className="text-sm text-slate-300">Units</label>
                <select
                  id="units"
                  className="mt-1 w-full rounded-xl bg-slate-900/60 border border-slate-700 px-3 py-2 text-sm"
                  value={prefs.units}
                  onChange={(e) => set("units", e.target.value as Preferences["units"])}
                  disabled={saving || loading}
                >
                  <option value="metric">Metric (Mb/s)</option>
                  <option value="binary">Binary (MiB/s)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving} className="rounded-xl px-5">
            {saving ? "Saving…" : "Save settings"}
          </Button>
          {saved === "ok" && <span className="text-xs text-emerald-400">Saved ✓</span>}
          {saved === "err" && <span className="text-xs text-rose-400">Save failed</span>}
        </div>
      </div>
    </div>
  );
}
