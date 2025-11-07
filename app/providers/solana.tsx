// app/providers/solana.tsx
"use client";

import * as React from "react";
import "@solana/wallet-adapter-react-ui/styles.css";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";

import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { clusterApiUrl } from "@solana/web3.js";

import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
// ⬇︎ ใช้ Backpack ได้ก็ต่อเมื่อแพ็กเกจถูกติดตั้ง
let BackpackAdapterCtor: any = null;
try {
  // จะไม่พังตอน build ถึงแม้ไม่ได้ติดตั้งแพ็กเกจ
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  BackpackAdapterCtor = require("@solana/wallet-adapter-backpack").BackpackWalletAdapter;
} catch { /* no-op */ }

const network: WalletAdapterNetwork =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) ||
  WalletAdapterNetwork.Devnet;

const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(network);

export default function SolanaProviders({ children }: { children: React.ReactNode }) {
  const wallets = React.useMemo(() => {
    const base = [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
    ];
    if (BackpackAdapterCtor) {
      base.push(new BackpackAdapterCtor());
    }
    return base;
  }, []); // network ถูก freeze ตอน build แล้ว ไม่ต้องใส่ใน deps

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect
        onError={(e) => console.error("[Solana wallet]", e)}
      >
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
