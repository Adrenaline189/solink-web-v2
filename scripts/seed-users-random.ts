import "dotenv/config";
import { prisma } from "@/server/db";

const NUM_USERS = 10;
const EVENTS_PER_USER = 3;

function floorToHour(d = new Date()) {
  const t = new Date(d);
  t.setUTCMinutes(0, 0, 0);
  return t;
}

async function main() {
  const hourNow = floorToHour();

  // สร้างผู้ใช้ u1..uN (id เท่านี้ก็พอ)
  for (let i = 1; i <= NUM_USERS; i++) {
    const id = `u${i}`;
    await prisma.user.upsert({
      where: { id },
      update: {},
      create: { id }
    });
  }

  // อีเวนต์สุ่มในชั่วโมงเดียวกัน
  const events: Array<{ userId: string; type: string; amount: number; createdAt: Date }> = [];
  for (let i = 1; i <= NUM_USERS; i++) {
    const userId = `u${i}`;
    for (let k = 0; k < EVENTS_PER_USER; k++) {
      const amount = Math.floor(Math.random() * 200) + 50; // 50..249
      const createdAt = new Date(hourNow.getTime()); // ภายในชั่วโมงเดียวกัน
      events.push({ userId, type: "extension_farm", amount, createdAt });
    }
  }

  const res = await prisma.pointEvent.createMany({ data: events, skipDuplicates: true });
  console.log("✅ Seeded random users/events:", res);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
