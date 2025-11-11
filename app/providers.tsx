// app/providers.tsx
"use client";

import "@rainbow-me/rainbowkit/styles.css";
import type { ReactNode } from "react";
import { useMemo } from "react";
import {
  RainbowKitProvider,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";

type ProvidersProps = { children: ReactNode };

const config = createConfig({
  chains: [mainnet],
  transports: {
    [mainnet.id]: http(),
  },
  ssr: true,
});

export default function Providers({ children }: ProvidersProps) {
  const theme = useMemo(
    () =>
      darkTheme({
        accentColor: "#6366F1",
        borderRadius: "large",
      }),
    []
  );

  return (
    <WagmiProvider config={config}>
      <RainbowKitProvider theme={theme}>{children}</RainbowKitProvider>
    </WagmiProvider>
  );
}
