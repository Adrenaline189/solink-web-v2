"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { ReactNode, useMemo } from "react";
import {
  RainbowKitProvider,
  darkTheme,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { http } from "viem";
import { sepolia, mainnet } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const WALLET_PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo_project_id";

const config = getDefaultConfig({
  appName: "Solink Presale",
  projectId: WALLET_PROJECT_ID,
  chains: [sepolia, mainnet],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_RPC_SEPOLIA || undefined),
    [mainnet.id]: http(process.env.NEXT_PUBLIC_RPC_MAINNET || undefined),
  },
  ssr: true, // critical for Next.js
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  // Keep theme stable
  const theme = useMemo(
    () =>
      darkTheme({
        accentColor: "#ffffff",
        accentColorForeground: "#0f172a",
        borderRadius: "large",
      }),
    []
  );

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
