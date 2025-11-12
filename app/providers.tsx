// app/providers.tsx
"use client";

import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";

type ProvidersProps = { children: ReactNode };

// ---- wagmi config (RainbowKit ต้องอยู่ใต้ WagmiProvider) ----
const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(), // ใช้ RPC เริ่มต้นของ wagmi; เปลี่ยนเป็นของคุณได้
  },
  ssr: true,
});

export default function Providers({ children }: ProvidersProps) {
  // React Query: สร้าง client ครั้งเดียวต่อ mount
  const [queryClient] = useState(() => new QueryClient());

  const theme = useMemo(
    () =>
      darkTheme({
        accentColor: "#6366F1",
        borderRadius: "large",
      }),
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
}
