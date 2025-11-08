// scripts/seed.ts
import { prisma } from "@/lib/prisma";

async function main() {
  const wallet = process.env.SEED_WALLET || "58p7...VjLw";

  const user = await prisma.user.upsert({
    where: { wallet },
    update: {},
    create: { wallet },
  });

  // seed 24 ชั่วโมงย้อนหลัง
  const base = new Date();
  base.setMinutes(0, 0, 0);
  for (let i = 23; i >= 0; i--) {
    const ts = new Date(base);
    ts.setHours(base.getHours() - i);
    const amount = 10 + Math.floor(Math.random() * 30);
    await prisma.pointEvent.create({
      data: {
        userId: user.id,
        type: "extension_farm",
        amount,
        meta: { hour: ts.toISOString(), note: "seed" },
        createdAt: ts,
      },
    });
  }

  // สรุปยอดใส่ PointBalance
  const agg = await prisma.pointEvent.aggregate({
    where: { userId: user.id },
    _sum: { amount: true },
  });
  await prisma.pointBalance.upsert({
    where: { userId: user.id },
    update: { balance: agg._sum.amount ?? 0 },
    create: { userId: user.id, balance: agg._sum.amount ?? 0 },
  });

  // optional: ตั้งค่า region/ip/version
  await prisma.setting.upsert({
    where: { userId_key: { userId: user.id, key: "region" } },
    update: { value: "TH-BKK" },
    create: { userId: user.id, key: "region", value: "TH-BKK" },
  });
  await prisma.setting.upsert({
    where: { userId_key: { userId: user.id, key: "version" } },
    update: { value: "solink-client/0.9.1" },
    create: { userId: user.id, key: "version", value: "solink-client/0.9.1" },
  });

  console.log("Seeded for", wallet);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(() => process.exit(0));
