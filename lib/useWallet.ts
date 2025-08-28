// lib/useWallet.ts
"use client";
import { useEffect, useState } from "react";

const KEY = "solink_mock_wallet";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    if (saved) setAddress(saved);
  }, []);

  async function connect() {
    setConnecting(true);
    try {
      // mock address
      const addr = "0x" + Math.random().toString(16).slice(2, 10).padEnd(40, "0");
      localStorage.setItem(KEY, addr);
      setAddress(addr);
    } finally {
      setConnecting(false);
    }
  }

  function disconnect() {
    localStorage.removeItem(KEY);
    setAddress(null);
  }

  return { address, connect, disconnect, connecting };
}
