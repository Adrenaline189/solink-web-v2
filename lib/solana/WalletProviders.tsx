// lib/solana/WalletProviders.tsx
'use client';

import '@solana/wallet-adapter-react-ui/styles.css';

import type { ReactNode } from 'react';
import React, { useMemo } from 'react';

import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { clusterApiUrl } from '@solana/web3.js';

type Props = { children: ReactNode };

export default function WalletProviders({ children }: Props) {
  const endpoint =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ||
    clusterApiUrl('mainnet-beta');

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      // ใช้ enum ให้ถูกชนิด
      new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet }),
    ],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
