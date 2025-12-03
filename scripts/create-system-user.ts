// scripts/create-system-user.ts
import "dotenv/config";
import { prisma } from "@/server/db";

async function main() {
  const id = "system";

  console.log("Upserting system user with id =", id);

  const user = await prisma.user.upsert({
    where: { id },
    update: {},
    create: {
      id,
      // ถ้า model User ต้องการ field อื่นด้วย เช่น wallet / createdAt ฯลฯ
      // ให้เติมตรงนี้ได้เลย
    },
  });

  console.log("✔ system user upserted:", user);
}

main()
  .catch((e) => {
    console.error("create-system-user error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
