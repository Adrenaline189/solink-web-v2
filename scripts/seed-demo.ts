import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.upsert({
    where: { wallet: "demo_wallet" },
    update: {},
    create: { wallet: "demo_wallet" },
  });
  await prisma.pointEvent.createMany({
    data: [
      { userId: u.id, type: "extension_farm", amount: 120, meta: { note: "Uptime slot bonus" } },
      { userId: u.id, type: "convert",        amount: 1000, meta: { note: "Convert +1 SLK" } },
      { userId: u.id, type: "referral",       amount: 50,   meta: { note: "Invite accepted" } },
    ],
    skipDuplicates: true,
  });
  console.log("seed ok");
}
main().finally(() => prisma.$disconnect());
