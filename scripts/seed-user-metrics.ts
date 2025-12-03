import { prisma } from "@/lib/prisma";

const WALLET = "58p7bc25e2gFKLVqMR3sYgfDTg3FmMPneaAy6yotVjLw";

async function main() {
  console.log("Seeding metricsHourly for:", WALLET);

  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);

  const rows = Array.from({ length: 6 }).map((_, i) => ({
    userId: WALLET,
    hourUtc: new Date(base.getTime() + i * 60 * 60 * 1000),
    pointsEarned: 50 + Math.floor(Math.random() * 50),
  }));

  await prisma.metricsHourly.createMany({ data: rows });

  console.log("Done.");
}

main().finally(() => prisma.$disconnect());
