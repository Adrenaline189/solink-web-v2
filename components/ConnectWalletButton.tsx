// components/ConnectWalletButton.tsx
"use client";

import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";

// ถ้ามีฮุค useWallet อยู่แล้ว ให้ใช้ของเดิม; ด้านล่างเป็นสตับใช้งานได้ทันที
function useWalletStub() {
  const [address, setAddress] = React.useState<string | undefined>();
  const [connecting, setConnecting] = React.useState(false);

  const connect = async () => {
    setConnecting(true);
    setTimeout(() => {
      setAddress("0xA1b2...C3d4");
      setConnecting(false);
    }, 600);
  };
  const disconnect = () => setAddress(undefined);

  return { address, connect, disconnect, connecting };
}

import * as React from "react";
// ถ้ามีของจริง ให้เปลี่ยนเป็น: import { useWallet } from "@/lib/useWallet";
const useWallet = useWalletStub;

export default function ConnectWalletButton() {
  const { address, connect, disconnect, connecting } = useWallet();

  if (address) {
    return (
      <Button onClick={disconnect} className="rounded-2xl px-5">
        {address} <Wallet className="ml-2 h-4 w-4" />
      </Button>
    );
  }

  return (
    <Button onClick={connect} disabled={connecting} className="rounded-2xl px-5">
      {connecting ? "Connecting…" : "Connect Wallet"} <Wallet className="ml-2 h-4 w-4" />
    </Button>
  );
}
