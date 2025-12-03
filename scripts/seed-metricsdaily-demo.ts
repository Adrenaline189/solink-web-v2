// scripts/seed-metricsdaily-demo.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const WALLET =
  process.env.DEMO_WALLET ||
  "58p7bc25e2gFKLVqMR3sYgfDTg3FmMPneaAy6yotVjLw";

// helper
function startOfUTC(d = new Date()) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

// ✔️ ensure user using wallet exists
async function ensureUserExists(wallet: string) {
  // เช็คแบบ WHERE wallet = xxx (ซึ่ง unique)
  const byWallet = await prisma.user.findFirst({ where: { wallet } });
  if (byWallet) {
    console.log(`✅ User already exists (wallet): ${wallet}`);
    return byWallet.id;
  }

  // ถ้ายังไม่เคยมี → สร้างใหม่ โดยใช้ wallet เป็น id เช่นเดิม
  console.log(`🧩 Creating new user for wallet: ${wallet}`);
  const created = await prisma.user.create({
    data: {
      id: wallet,
      wallet,
      createdAt: new Date(),
    },
  });
  return created.id;
}

async function main() {
  const todayUtc = startOfUTC();

  console.log("==========================================");
  console.log(" Seeding MetricsDaily (SYSTEM + USER demo)");
  console.log("==========================================");

  console.log("DATABASE_URL:", process.env.DATABASE_URL?.slice(0, 60) + "…");
  console.log("Wallet:", WALLET);
  console.log("Today:", todayUtc.toISOString());

  // --- STEP 1: ensure system + user exist ---
  await ensureUserExists("system");
  const userId = await ensureUserExists(WALLET);

  // --- STEP 2: clear old rows ---
  console.log("🧹 Clearing MetricsDaily for today...");
  await prisma.metricsDaily.deleteMany({
    where: {
      dayUtc: todayUtc,
      userId: { in: ["system", userId] },
    },
  });

  // --- STEP 3: seed system row ---
  console.log("🧩 Creating MetricsDaily (system)...");
  await prisma.metricsDaily.create({
    data: {
      dayUtc: todayUtc,
      userId: "system",
      pointsEarned: 12345,
      uptimePct: 99,
      avgBandwidth: 150,
      qfScore: 90,
      trustScore: 93,
    },
  });

  // --- STEP 4: seed user row ---
  console.log("🧩 Creating MetricsDaily (user)...");
  await prisma.metricsDaily.create({
    data: {
      dayUtc: todayUtc,
      userId,
      pointsEarned: 2000,
      uptimePct: 88,
      avgBandwidth: 80,
      qfScore: 87,
      trustScore: 86,
    },
  });

  console.log("🎉 Done! MetricsDaily seeded successfully.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
