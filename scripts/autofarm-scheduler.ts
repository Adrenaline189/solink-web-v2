import cron from "node-cron";
import axios from "axios";
import fs from "fs";
import path from "path";

const configPath = path.join(__dirname, "config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

interface WalletStatus {
  balance: number;
  earned: number;
  done: boolean;
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

async function earn(wallet: string, session: string) {
  try {
    const res = await axios.post(
      config.apiBase,
      {
        type: config.type,
        amount: config.amountPerShot,
        meta: { session }
      },
      { headers: { Authorization: `Bearer ${config.authToken}` } }
    );
    return res.data?.balance ?? 0;
  } catch (e: any) {
    return e.response?.status === 429 ? "RATE_LIMIT" : "ERROR";
  }
}

async function farmWallet(wallet: string) {
  const walletStatus: WalletStatus = { balance: 0, earned: 0, done: false };
  console.log(`🌱 Starting AutoFarm for wallet: ${wallet}`);

  for (let i = 0; i < config.bursts; i++) {
    if (walletStatus.earned >= config.dailyCap) {
      walletStatus.done = true;
      break;
    }

    const session = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const result = await earn(wallet, session);

    if (result === "RATE_LIMIT") {
      console.log("⚠️ Rate limited, retrying in 5s...");
      await delay(5000);
      i--;
      continue;
    } else if (result === "ERROR") {
      console.log("❌ Error on shot, skipping...");
      continue;
    } else {
      walletStatus.balance = result;
      walletStatus.earned += config.amountPerShot;
      console.log(`✅ +${config.amountPerShot} (${walletStatus.earned}/${config.dailyCap})`);
    }

    const wait =
      config.minDelayMs + Math.floor(Math.random() * config.jitterMs);
    await delay(wait);
  }

  console.log(`🌾 Finished ${wallet}: ${walletStatus.earned}/${config.dailyCap}`);
  return walletStatus;
}

// 🕐 ตั้งเวลาให้รันทุกวันตอนเที่ยงคืน (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("🚀 AutoFarm daily task started", new Date().toLocaleString());
  for (const wallet of config.wallets) {
    await farmWallet(wallet);
  }
  console.log("✅ AutoFarm completed", new Date().toLocaleString());
});

// ทดสอบด้วยการรันทันที (กด Ctrl+C เพื่อหยุด)
(async () => {
  console.log("🔧 Manual test run started...");
  for (const wallet of config.wallets) {
    await farmWallet(wallet);
  }
})();
