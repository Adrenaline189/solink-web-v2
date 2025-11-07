'use client';

import React, { useMemo, ReactNode } from 'react';
import '@solana/wallet-adapter-react-ui/styles.css';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';

import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

// ✅ นำเข้า adapter เป็นรายแพ็กเกจ (หลีกเลี่ยงปัญหา @solana/wallet-adapter-wallets)
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
// Backpack เป็น optional: ติดตั้งแพ็กเกจไว้ แล้วเปิดใช้ได้
// ถ้าไม่ใช้ ให้คอมเมนต์ 2 บรรทัดต่อไปนี้ทิ้ง
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';

const network =
  (process.env.NEXT_PUBLIC_SOLANA_NETWORK as WalletAdapterNetwork) ||
  WalletAdapterNetwork.Devnet;

const endpoint =
  process.env.NEXT_PUBLIC_SOLANA_RPC || clusterApiUrl(network);

export default function WalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter({ network }),
      new SolflareWalletAdapter({ network }),
      // ถ้ายังไม่ติดตั้ง backpack แพ็กเกจ ให้คอมเมนต์บรรทัดนี้ไว้ก่อน
      new BackpackWalletAdapter(),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect onError={(e) => console.error('[Solana wallet]', e)}>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
