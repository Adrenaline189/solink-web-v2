// scripts/seed-events-for-wallet.ts
import { prisma } from "../lib/prisma";

const WALLET = "58p7bc25e2gFKLVqMR3sYgfDTg3FmMPneaAy6yotVjLw";

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log("Looking up user by wallet:", WALLET);

  const user = await prisma.user.findFirst({
    where: { wallet: WALLET },
    select: { id: true },
  });

  if (!user) {
    throw new Error(`No User found with wallet=${WALLET}`);
  }

  const userId = user.id;
  console.log("Using userId:", userId);

  await prisma.pointEvent.createMany({
    data: [
      {
        userId,
        type: "extension_farm",
        amount: 120,
        meta: { note: "Uptime slot bonus" },
        createdAt: daysAgo(0),
      },
      {
        userId,
        type: "extension_farm",
        amount: 50,
        meta: { session: "dash-demo-1" },
        createdAt: daysAgo(1),
      },
      {
        userId,
        type: "extension_farm",
        amount: 50,
        meta: { session: "dash-demo-2" },
        createdAt: daysAgo(2),
      },
      {
        userId,
        type: "referral",
        amount: 50,
        meta: { note: "Invite accepted" },
        createdAt: daysAgo(3),
      },
      {
        userId,
        type: "referral_bonus",
        amount: 100,
        meta: { reason: "first_earn_friend" },
        createdAt: daysAgo(5),
      },
      {
        userId,
        type: "convert",
        amount: 1000,
        meta: { note: "Convert +1 SLK" },
        createdAt: daysAgo(7),
      },
    ],
  });

  console.log("✓ Seeded events for wallet:", WALLET);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
