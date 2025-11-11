import { prisma } from "../lib/prisma";

async function main() {
  // เพิ่ม balance ตัวอย่างให้ user "system"
  const result = await prisma.pointBalance.upsert({
    where: { userId: "system" },
    create: { userId: "system", balance: 50000 },
    update: { balance: { increment: 50000 } },
  });

  console.log("✅ Seeded balance:", result);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding balance:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
