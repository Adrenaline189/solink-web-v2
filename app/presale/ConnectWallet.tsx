'use client';

import { useMemo } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useSwitchChain } from 'wagmi';
import { bsc } from 'wagmi/chains';

export default function ConnectWallet() {
  const { address, chainId, isConnected } = useAccount();
  const { switchChain } = useSwitchChain();

  const short = useMemo(() => {
    if (!address) return '';
    return `${address.slice(0, 6)}…${address.slice(-4)}`;
  }, [address]);

  return (
    <div className="flex flex-col gap-3">
      <ConnectButton />

      {isConnected && (
        <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm">
          <div>Address: <span className="font-mono">{short}</span></div>
          <div>Chain ID: <span className="font-mono">{chainId ?? '-'}</span></div>
          {chainId !== bsc.id && (
            <button
              onClick={() => switchChain({ chainId: bsc.id })}
              className="mt-2 rounded-md bg-indigo-600 px-3 py-1.5 text-white hover:bg-indigo-500"
            >
              Switch to BSC
            </button>
          )}
        </div>
      )}
    </div>
  );
}
