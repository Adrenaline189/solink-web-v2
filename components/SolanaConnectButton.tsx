"use client";

import React, { useMemo, useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  ChevronDown,
  Copy,
  LogOut,
  Repeat,
  Wallet as WalletIcon,
} from "lucide-react";

function shortAddr(s?: string) {
  if (!s) return "";
  return `${s.slice(0, 4)}…${s.slice(-4)}`;
}

export default function SolanaConnectButton({
  className = "",
  variant = "primary",
}: {
  className?: string;
  variant?: "primary" | "ghost";
}) {
  const { connected, connecting, publicKey, wallet, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);

  // ✅ ensure client-only UI to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const addr = useMemo(() => publicKey?.toBase58() ?? "", [publicKey]);
  const label = connecting
    ? "Connecting…"
    : connected
    ? shortAddr(addr)
    : "Connect Wallet";

  // use icon only after mounted
  const iconUrl = mounted ? wallet?.adapter?.icon : undefined;

  const base =
    "inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-white/20";
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500 text-white"
      : "bg-white/10 hover:bg-white/15 text-white border border-white/10";

  const menuId = "wallet-menu";

  // ✅ aria-expanded: ให้เป็น boolean หรือ undefined
  const expanded: boolean | undefined = connected ? !!open : undefined;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={expanded}
        onClick={() => (connected ? setOpen((v) => !v) : setVisible(true))}
        className={`${base} ${styles}`}
      >
        {/* placeholder icon on SSR; <img> only after mount */}
        {iconUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={iconUrl} alt="" className="h-5 w-5 rounded-md" />
        ) : (
          <WalletIcon className="h-4 w-4" />
        )}
        <span className="tabular-nums" suppressHydrationWarning>
          {label}
        </span>
        <ChevronDown
          className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {connected && open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur shadow-lg p-1"
          onMouseLeave={() => setOpen(false)}
        >
          <button
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setVisible(true);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left text-sm"
          >
            <Repeat className="h-4 w-4" /> Change wallet
          </button>
          <button
            role="menuitem"
            onClick={() => navigator.clipboard?.writeText(addr)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/10 text-left text-sm"
          >
            <Copy className="h-4 w-4" /> Copy address
          </button>
          <button
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              try {
                await disconnect();
              } catch {}
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-left text-sm text-red-300"
          >
            <LogOut className="h-4 w-4" /> Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
