// scripts/farm-test.ts
//
// Simple test farmer to hit /api/points/earn in a loop
// ใช้เทสต์ว่า backend แจกแต้ม + Dashboard อัปเดตจริง

const API_URL = process.env.API_URL || "http://localhost:3000";
const API_KEY = process.env.API_KEY || "";
const WALLET = process.env.WALLET || "";

const TYPE = "extension_farm";
const AMOUNT_PER_TICK = 50;       // ให้ทีละ 50 แต้ม
const INTERVAL_MS = 15_000;       // ยิงทุก 15 วินาที (อย่าเร็วกว่าคูลดาวน์จริง)

if (!API_KEY) {
  console.error("Missing API_KEY env");
  process.exit(1);
}
if (!WALLET) {
  console.error("Missing WALLET env");
  process.exit(1);
}

async function tick() {
  try {
    const res = await fetch(`${API_URL}/api/points/earn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": API_KEY,
      },
      body: JSON.stringify({
        wallet: WALLET,
        type: TYPE,
        amount: AMOUNT_PER_TICK,
        meta: {
          source: "farm-test",
          // ตรงนี้อนาคตค่อยใส่ bandwidth, uptime ฯลฯ จาก extension
        },
      }),
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.ok) {
      console.error(
        `[${new Date().toISOString()}] ❌ error`,
        res.status,
        json.error || json,
      );
      return;
    }

    console.log(
      `[${new Date().toISOString()}] ✅ credited=${json.credited} pts | ` +
        `today used=${json.daily?.used} / cap=${json.daily?.cap} | ` +
        `remain=${json.daily?.remain}`,
    );

    if (json.balance) {
      console.log(
        `   Total balance: ${json.balance.points} pts, ${json.balance.slk} SLK`,
      );
    }
  } catch (e: any) {
    console.error(
      `[${new Date().toISOString()}] ❌ request failed`,
      e?.message || e,
    );
  }
}

async function main() {
  console.log("Starting farm-test...");
  console.log("API_URL =", API_URL);
  console.log("WALLET  =", WALLET);

  // ยิงทีแรกเลย
  await tick();

  // แล้วค่อยยิงเรื่อย ๆ
  setInterval(tick, INTERVAL_MS);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
