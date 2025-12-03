// scripts/demo-node-status-ping.ts
import "dotenv/config";

const baseUrl =
  process.env.DASHBOARD_BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
const wallet =
  process.env.DEMO_WALLET ||
  "58p7bc25e2gFKLVqMR3sYgfDTg3FmMPneaAy6yotVjLw";

async function main() {
  console.log("Pinging node status for wallet:", wallet);
  console.log("Base URL:", baseUrl);

  const payload = {
    wallet,
    latencyMs: 42,
    uptimePct: 95,
    avgBandwidth: 12.5,
    qfScore: 88,
    trustScore: 76,
    clientVersion: "demo-node/0.1.0",
  };

  const res = await fetch(`${baseUrl}/api/node/status-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  console.log("HTTP", res.status, res.statusText);

  try {
    console.log("JSON:", JSON.parse(text));
  } catch {
    console.log("Raw body:", text);
  }
}

main().catch((e) => {
  console.error("Ping failed:", e);
  process.exit(1);
});
