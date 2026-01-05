"use client";

import React, { useCallback, useEffect, useState } from "react";
import NextDynamic from "next/dynamic";
import { useWallet } from "@solana/wallet-adapter-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Power } from "lucide-react";

const WalletMultiButton = NextDynamic(
  async () => (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

type ToggleResponse = {
  ok: boolean;
  enabled?: boolean;
  error?: string;
};

function humanizeError(e: unknown) {
  const msg = (e as any)?.message || String(e || "");
  const m = msg.toLowerCase();
  if (m.includes("401") || m.includes("unauthorized")) {
    return "Unauthorized (401). Please connect wallet and login first.";
  }
  if (m.includes("403") || m.includes("forbidden")) {
    return "Forbidden (403). Your account is not allowed to access admin controls.";
  }
  return msg || "Request failed";
}

export default function AdminPage() {
  // กัน hydration mismatch
  const [mounted, setMounted] = useState(false);

  const { publicKey, connected } = useWallet();
  const address = publicKey?.toBase58();

  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);

  const loadStatus = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const res = await fetch("/api/admin/convert-toggle", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
      });

      const data: ToggleResponse = await res
        .json()
        .catch(() => ({ ok: false, error: "invalid json" }));

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status} (${res.statusText})`);
      }

      if (!data.ok || typeof data.enabled !== "boolean") {
        throw new Error(data.error || "Failed to load");
      }

      setEnabled(data.enabled);
    } catch (e: any) {
      setError(humanizeError(e));
      setEnabled(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const doLogin = useCallback(async () => {
    if (!connected || !address) return false;

    try {
      setAuthLoading(true);
      setError(null);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ wallet: address }),
      });

      // บางระบบอาจส่ง non-json → จับไว้
      const data = await res.json().catch(() => ({} as any));

      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status} (${res.statusText})`);
      }

      return true;
    } catch (e: any) {
      setError("Login failed: " + humanizeError(e));
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [connected, address]);

  // ล็อกอินอัตโนมัติเมื่อ wallet connected แล้วค่อย load status
  useEffect(() => {
    if (!mounted) return;
    if (!connected || !address) return;

    (async () => {
      const ok = await doLogin();
      if (ok) await loadStatus();
    })();
  }, [mounted, connected, address, doLogin, loadStatus]);

  // โหลดครั้งแรก (ถ้ามี cookie อยู่แล้ว)
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
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ enabled: !enabled }),
      });

      const data: ToggleResponse = await res
        .json()
        .catch(() => ({ ok: false, error: "invalid json" }));

      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status} (${res.statusText})`);
      }

      if (!data.ok || typeof data.enabled !== "boolean") {
        throw new Error(data.error || "Toggle failed");
      }

      setEnabled(data.enabled);
    } catch (e: any) {
      setError(humanizeError(e));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  // render ฝั่ง client เท่านั้น
  if (!mounted) return null;

  const statusText = enabled === null ? "Loading…" : enabled ? "OPEN" : "CLOSED";
  const statusClass =
    enabled === null ? "text-slate-400" : enabled ? "text-emerald-400" : "text-rose-400";

  const canAdmin = connected && !!address;

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header + Wallet */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Admin • Conversion window</h1>
          <p className="text-slate-400 text-sm">Toggle conversion window (points → SLK)</p>
          <div className="text-xs text-slate-500">
            Wallet:{" "}
            {connected && address ? (
              <span className="text-slate-300">{address.slice(0, 6)}…{address.slice(-4)}</span>
            ) : (
              <span className="text-slate-400">not connected</span>
            )}
          </div>
        </div>

        <div className="wa-equal">
          <WalletMultiButton />
        </div>
      </div>

      <Card className="mt-6">
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-slate-400">Conversion status</div>
              <div className={`text-xl font-semibold ${statusClass}`}>{statusText}</div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={loadStatus}
                disabled={loading || authLoading}
                title="Reload current conversion status"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>

              <Button
                onClick={toggle}
                disabled={!canAdmin || enabled === null || loading || authLoading}
                variant={enabled ? "outline" : "secondary"}
                title={!canAdmin ? "Connect wallet first" : "Toggle conversion window"}
              >
                <Power className="h-4 w-4 mr-2" />
                {enabled ? "Close" : "Open"}
              </Button>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            This page controls the global conversion switch. When closed, users cannot convert points
            to SLK even if they have enough balance.
          </p>

          {!connected && (
            <div className="mt-2 rounded-md border border-slate-700 bg-slate-900/40 px-3 py-2 text-xs text-slate-300">
              Connect your wallet to login and access admin controls.
            </div>
          )}

          {connected && address && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <Button
                variant="outline"
                className="rounded-xl"
                disabled={authLoading}
                onClick={async () => {
                  const ok = await doLogin();
                  if (ok) await loadStatus();
                }}
                title="Force login again"
              >
                {authLoading ? "Logging in…" : "Login"}
              </Button>
              <span className="text-slate-500">
                (If you still see 401, your server auth cookie may be blocked by browser settings.)
              </span>
            </div>
          )}

          {error && (
            <div className="mt-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
              Error: {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Global styles for wallet button sizing */}
      <style jsx global>{`
        .wa-equal .wallet-adapter-button {
          height: 3rem;
          padding: 0 1.25rem;
          border-radius: 1rem;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          line-height: 1;
        }
        .wa-equal .wallet-adapter-button .wallet-adapter-button-start-icon,
        .wa-equal .wallet-adapter-button .wallet-adapter-button-end-icon {
          width: 1rem;
          height: 1rem;
        }
      `}</style>
    </main>
  );
}
