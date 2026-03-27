/**
 * wallet.ts — Solana wallet connection for the CLI node client
 * 
 * Supports:
 * - Environment variable: WALLET_PRIVATE_KEY (base58)
 * 
 * For CLI usage, set WALLET_PRIVATE_KEY to your base58-encoded private key.
 * CAUTION: Never commit this key or share it.
 */

import { Connection, Keypair, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const MAINNET_RPC = "https://api.mainnet-beta.solana.com";

let _keypair: Keypair | null = null;
let _publicKey: PublicKey | null = null;

export type WalletInfo = {
  address: string;
  sol: number;
};

/**
 * Get the public key of the connected wallet.
 */
export function getPublicKey(): PublicKey | null {
  if (_publicKey) return _publicKey;
  const keypair = getKeypair();
  if (!keypair) return null;
  _publicKey = keypair.publicKey;
  return _publicKey;
}

/**
 * Get or create a Keypair from environment variable.
 */
function getKeypair(): Keypair | null {
  if (_keypair) return _keypair;

  const secretBase58 = process.env.WALLET_PRIVATE_KEY;

  if (!secretBase58) {
    console.warn("    WALLET_PRIVATE_KEY not set");
    console.info("    Set it: export WALLET_PRIVATE_KEY=<your-base58-private-key>");
    return null;
  }

  try {
    const cleaned = secretBase58.trim();
    const decoded = base58ToUint8Array(cleaned);
    _keypair = Keypair.fromSecretKey(decoded);
    _publicKey = _keypair.publicKey;
    return _keypair;
  } catch (e: any) {
    console.error("    Invalid WALLET_PRIVATE_KEY:", e?.message ?? e);
    return null;
  }
}

/**
 * Get wallet balance.
 */
export async function getWalletBalance(): Promise<WalletInfo> {
  const address = getPublicKey()?.toBase58() ?? "unknown";

  if (!getKeypair()) {
    return { address, sol: 0 };
  }

  try {
    const connection = new Connection(MAINNET_RPC, "confirmed");
    const balance = await connection.getBalance(getKeypair()!.publicKey, "confirmed");
    return {
      address,
      sol: balance / LAMPORTS_PER_SOL,
    };
  } catch (e: any) {
    console.warn("    Could not fetch balance:", e?.message ?? e);
    return { address, sol: 0 };
  }
}

/**
 * Simple base58 decoder (pure JS, no deps)
 */
function base58ToUint8Array(base58: string): Uint8Array {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const base = BigInt(58);

  let result = BigInt(0);
  for (const char of base58) {
    const index = ALPHABET.indexOf(char);
    if (index === -1) throw new Error(`Invalid base58: ${char}`);
    result = result * base + BigInt(index);
  }

  // BigInt → Uint8Array (big-endian for Solana secret key)
  const hex = result.toString(16).padStart(2, "0");
  const paddedHex = hex.length % 2 === 0 ? hex : "0" + hex;
  const bytes = new Uint8Array(paddedHex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(paddedHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
