"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import bs58 from "bs58";

export async function signInWithWallet(publicKey: any, signMessage: any) {
  // 1) nonce
  const r1 = await fetch("/api/auth/nonce", { cache: "no-store" });
  const { nonce } = await r1.json();

  // 2) sign message
  const message = new TextEncoder().encode(`Solink login\nNonce: ${nonce}`);
  const sig = await signMessage(message);
  const signature = bs58.encode(sig);

  // 3) verify -> Set-Cookie: AUTH
  const r2 = await fetch("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      address: publicKey.toBase58(),
      signature,
      nonce,
      network: process.env.NEXT_PUBLIC_SOLANA_CLUSTER,
    }),
  });
  const j = await r2.json();
  if (!j.ok) throw new Error(j.error || "Login failed");
}
