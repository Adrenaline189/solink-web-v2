/**
 * Solink Node Client
 * 
 * Usage:
 *   npx ts-node src/index.ts
 *   node dist/index.js
 * 
 * Environment:
 *   SOLINK_API_URL   - Backend API URL (default: https://api.solink.network)
 *   WALLET_PRIVATE_KEY - Solana wallet private key (base58)
 */

import { PublicKey } from "@solana/web3.js";
import { sendHeartbeat } from "./heartbeat.js";
import { measureBandwidth } from "./bandwidth.js";
import { getWalletBalance } from "./wallet.js";

const API_BASE = process.env.SOLINK_API_URL ?? "https://api.solink.network";

async function main() {
  console.log("========================================");
  console.log("  Solink Node Client v0.1.0");
  console.log("========================================");
  console.log(`  API: ${API_BASE}`);
  console.log("----------------------------------------");

  // 1. Check wallet
  console.log("\n[1] Checking wallet...");
  try {
    const balance = await getWalletBalance();
    console.log(`    Wallet: ${balance.address}`);
    console.log(`    SOL:   ${balance.sol.toFixed(4)} SOL`);
    if (balance.sol < 0.001) {
      console.warn("    ⚠️  Low SOL balance. You'll need SOL for transaction fees.");
    }
  } catch (e: any) {
    console.error("    ❌ Wallet error:", e?.message ?? e);
    console.log("    Set WALLET_PRIVATE_KEY environment variable.");
    return;
  }

  // 2. Measure bandwidth
  console.log("\n[2] Measuring bandwidth...");
  const bw = await measureBandwidth();
  console.log(`    Download: ${bw.download.toFixed(1)} Mbps`);
  console.log(`    Upload:   ${bw.upload.toFixed(1)} Mbps`);
  console.log(`    Latency:  ${bw.latencyMs} ms`);

  // 3. Send heartbeat
  console.log("\n[3] Sending heartbeat...");
  const result = await sendHeartbeat({
    downloadMbps: bw.download,
    uploadMbps: bw.upload,
    latencyMs: bw.latencyMs,
  });

  if (result.ok) {
    console.log(`    ✅ Heartbeat sent!`);
    console.log(`    Awarded: ${result.awarded} pts`);
    console.log(`    Balance: ${result.balance?.toLocaleString() ?? "—"} pts`);
  } else {
    console.error(`    ❌ Error: ${result.error ?? "Unknown"}`);
  }

  console.log("\n========================================");
  console.log("  Done. Run again in 15 minutes for next heartbeat.");
  console.log("========================================\n");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
