// scripts/seed-balance.ts
import { prisma } from "@/lib/prisma";

async function main() {
  // สมมติระบบมี user เดียวรวมเป็น system
  await prisma.pointBalance.upsert({
    where: { userId: "system" },
    create: { userId: "system", balance: 638, updatedAt: new Date() },
    update: { balance: 638, updatedAt: new Date() },
  });
}
main().finally(() => process.exit(0));
