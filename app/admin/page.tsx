// app/admin/page.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Power } from "lucide-react";

type ToggleResponse = {
  ok: boolean;
  enabled?: boolean;
  error?: string;
};

export default function AdminPage() {
  // กัน hydration mismatch
  const [mounted, setMounted] = useState(false);

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      const res = await fetch("/api/admin/convert-toggle", {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const data: ToggleResponse = await res
        .json()
        .catch(() => ({ ok: false, error: "invalid json" }));

      if (!data.ok || typeof data.enabled !== "boolean") {
        throw new Error(data.error || "Failed to load");
      }

      setEnabled(data.enabled);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load");
      setEnabled(null);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    void loadStatus();
  }, [mounted, loadStatus]);

  const toggle = useCallback(async () => {
    if (enabled === null) return;

    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/convert-toggle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ enabled: !enabled }),
      });

      const data: ToggleResponse = await res
        .json()
        .catch(() => ({ ok: false, error: "invalid json" }));

      if (!data.ok || typeof data.enabled !== "boolean") {
        throw new Error(data.error || "Toggle failed");
      }

      setEnabled(data.enabled);
    } catch (e: any) {
      setError(e?.message ?? "Toggle failed");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // render ฝั่ง client เท่านั้น เพื่อตัด hydration error
  if (!mounted) {
    return null;
  }

  const statusText =
    enabled === null ? "Loading…" : enabled ? "OPEN" : "CLOSED";
  const statusClass =
    enabled === null
      ? "text-slate-400"
      : enabled
      ? "text-emerald-400"
      : "text-rose-400";

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Admin • Conversion window
        </h1>
        <p className="text-slate-400 text-sm">
          Toggle conversion window (points → SLK)
        </p>
      </div>

      <Card className="mt-6">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Conversion status</div>
              <div className={`text-xl font-semibold ${statusClass}`}>
                {statusText}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadStatus}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={toggle}
                disabled={enabled === null || loading}
                variant={enabled ? "outline" : "secondary"}
              >
                <Power className="h-4 w-4 mr-2" />
                {enabled ? "Close" : "Open"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            This page controls the global conversion switch. When closed, users
            cannot convert points to SLK even if they have enough balance.
          </p>

          {error && (
            <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
