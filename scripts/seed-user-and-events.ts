// scripts/seed-user-and-events.ts
//
// ใช้สำหรับ seed user ทดสอบ + เติมแต้มตัวอย่างเล็กน้อย
// รันด้วย:
//   npx tsx scripts/seed-user-and-events.ts

import { prisma } from "@/lib/prisma";

const WALLET =
  process.env.WALLET ||
  process.env.ADMIN_WALLET ||
  "demo_wallet_1111111111111111111111111";

async function main() {
  console.log("[seed-user-and-events] using wallet =", WALLET);

  // 1) สร้าง / หา user จาก wallet (unique)
  const user = await prisma.user.upsert({
    where: { wallet: WALLET },
    update: {},
    create: {
      wallet: WALLET,
    },
  });

  console.log("[seed-user-and-events] user id =", user.id);

  // 2) สร้าง PointEvent ตัวอย่างสัก 3 แถว
  const now = new Date();
  const baseAmount = 100;

  const events = await prisma.$transaction([
    prisma.pointEvent.create({
      data: {
        userId: user.id,
        type: "extension_farm",
        amount: baseAmount,
        meta: { reason: "seed event #1" },
        createdAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      },
    }),
    prisma.pointEvent.create({
      data: {
        userId: user.id,
        type: "extension_farm",
        amount: baseAmount,
        meta: { reason: "seed event #2" },
        createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      },
    }),
    prisma.pointEvent.create({
      data: {
        userId: user.id,
        type: "extension_farm",
        amount: baseAmount,
        meta: { reason: "seed event #3" },
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
      },
    }),
  ]);

  // 3) รวมแต้มทั้งหมด (แก้ implicit any โดยใช้ typeof events[number])
  const totalEarned = events.reduce(
    (sum: number, e: (typeof events)[number]) => sum + e.amount,
    0
  );

  console.log(
    `[seed-user-and-events] created ${events.length} events, total = ${totalEarned} pts`
  );

  // 4) อัปเดต PointBalance ให้ตรงกับยอดแต้มที่ seed
  const balance = await prisma.pointBalance.upsert({
    where: { userId: user.id },
    update: {
      balance: { increment: totalEarned },
    },
    create: {
      userId: user.id,
      balance: totalEarned,
      slk: 0,
    },
  });

  console.log(
    "[seed-user-and-events] point balance for user =",
    balance.balance,
    "pts"
  );

  console.log("[seed-user-and-events] ✅ done");
}

main()
  .catch((err) => {
    console.error("[seed-user-and-events] ❌ error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
