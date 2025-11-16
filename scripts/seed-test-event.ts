// scripts/seed-test-event.ts
import { prisma } from "@/server/db";

async function main() {
  const userId = "u1"; // ใช้ user ที่มีอยู่จริงใน DB นี้
  const amount = 1234;

  const now = new Date();
  const event = await prisma.pointEvent.create({
    data: {
      userId,
      type: "extension_farm",
      amount,
      meta: { session: "local-test-rollup" } as any,
      createdAt: now,
    },
  });

  console.log("Created pointEvent:", event);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
