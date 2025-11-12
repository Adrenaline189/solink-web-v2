"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getJSON, postJSON } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, RefreshCw, Rocket, Database, Wallet, WalletMinimal } from "lucide-react";
import { useWallet as useSolanaWallet } from "@solana/wallet-adapter-react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

type MetricsResp = {
  ok: boolean;
  daily?: { dayUtc: string; pointsEarned: number };
  hourly?: Array<{ hourUtc: string; pointsEarned: number }>;
};

export default function DevPanel() {
  const qc = useQueryClient();

  // --- Wallets ---
  const { publicKey, connected } = useSolanaWallet();
  const solAddr = publicKey?.toBase58() ?? null;

  // --- React Query hello ---
  const hello = useQuery({
    queryKey: ["dev-hello"],
    queryFn: async () => {
      const r = await getJSON<{ ok: boolean; ts: string; env: any }>("/api/dev/ping");
      return r;
    },
    refetchInterval: 10_000,
  });

  // --- Metrics ---
  const metrics = useQuery<MetricsResp>({
    queryKey: ["metrics"],
    queryFn: () => getJSON<MetricsResp>("/api/dashboard/metrics"),
    refetchInterval: 15_000,
  });

  const daily = metrics.data?.daily?.pointsEarned ?? 0;
  const lastHour = useMemo(() => {
    const h = metrics.data?.hourly ?? [];
    return h.length ? h[h.length - 1].pointsEarned : 0;
  }, [metrics.data]);

  // --- Enqueue rollup ---
  const enqueue = useMutation({
    mutationFn: () => postJSON<{ ok: boolean; queued: boolean }>("/api/cron/rollup-hourly"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["metrics"] }),
  });

  return (
    <Card className="border-slate-800">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          <div className="font-medium">Hello from React Query</div>
          <div className="text-xs text-slate-400">
            {hello.isSuccess ? `✓ ${hello.data?.ts}` : hello.isLoading ? "loading…" : "error"}
          </div>
        </div>

        {/* Wallets row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="h-4 w-4" />
              <div className="font-semibold">Solana Wallet</div>
            </div>
            <div className="text-sm text-slate-300">
              {connected ? (
                <>
                  Connected: <span className="text-sky-300">{solAddr?.slice(0, 6)}…{solAddr?.slice(-6)}</span>
                </>
              ) : (
                "Not connected"
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <WalletMinimal className="h-4 w-4" />
              <div className="font-semibold">EVM Wallet (RainbowKit)</div>
            </div>
            <ConnectButton.AccountStatus />
          </div>
        </div>

        {/* Metrics quick glance */}
        <div className="rounded-xl border border-slate-800 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <div className="font-semibold">Metrics Snapshot</div>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => qc.invalidateQueries({ queryKey: ["metrics"] })}
            >
              <RefreshCw className="h-4 w-4 mr-1" /> Refresh
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <Stat label="Daily Total (system)" value={daily.toLocaleString()} />
            <Stat label="Last Hour (system)" value={lastHour.toLocaleString()} />
            <Stat
              label="Points @ 14:00 (sample)"
              value={
                (metrics.data?.hourly?.find((h) => new Date(h.hourUtc).getUTCHours() === 14)?.pointsEarned ?? 0)
                  .toLocaleString()
              }
            />
            <Stat label="Status" value={metrics.isLoading ? "Loading…" : metrics.isError ? "Error" : "OK"} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => hello.refetch()}
            variant="secondary"
            title="/api/dev/ping"
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Ping API
          </Button>

          <Button
            onClick={() => enqueue.mutate()}
            disabled={enqueue.isPending}
            title="/api/cron/rollup-hourly"
          >
            <Rocket className="h-4 w-4 mr-2" />
            {enqueue.isPending ? "Enqueue…" : "Enqueue Rollup"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-slate-900/60 border border-slate-800 p-3">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
