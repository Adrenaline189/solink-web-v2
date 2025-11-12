// scripts/seed-events-today.ts
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// ตั้ง user ที่จะใช้ลงอีเวนต์
const USER_ID = process.env.SEED_USER_ID || "system"; // ตรงกับ seed-balance เดิม

// helper: สร้างเวลา UTC ของวันนี้ที่ชั่วโมง X
function atUTC(hour: number) {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0, 0));
  return d;
}

async function main() {
  console.log("✅ DATABASE_URL loaded:", (process.env.DATABASE_URL || "").replace(/:.+@/, ":***@"));

  // 1) ให้แน่ใจว่ามี User ก่อน (upsert)
  await prisma.user.upsert({
    where: { id: USER_ID },
    create: { id: USER_ID, wallet: null },
    update: {},
  });

  // (optional) ให้มี PointBalance ติดไว้ด้วย
  await prisma.pointBalance.upsert({
    where: { userId: USER_ID },
    create: { userId: USER_ID, balance: 50_000 },
    update: {},
  });

  // 2) ใส่เหตุการณ์ของวันนี้ (ตัวอย่าง)
  const rows = [
    { userId: USER_ID, type: "extension_farm", amount: 200, createdAt: atUTC(9)  },
    { userId: USER_ID, type: "extension_farm", amount: 300, createdAt: atUTC(11) },
    { userId: USER_ID, type: "extension_farm", amount: 500, createdAt: atUTC(14) },
  ];

  const res = await prisma.pointEvent.createMany({
    data: rows,
    skipDuplicates: true, // กันซ้ำถ้ารันซ้ำ
  });

  console.log("✅ Seeded events:", res);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
