// scripts/seed-events-today.ts
import { prisma } from "../lib/prisma";

const USER_ID = process.env.SEED_USER_ID || "system"; // เปลี่ยนได้ตามต้องการ

function atUTC(hours:number, minutes=0){
  const now = new Date();
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours, minutes, 0, 0
  ));
}

async function main() {
  const data = [
    { userId: USER_ID, type: "extension_farm", amount: 300, createdAt: atUTC(2)  },
    { userId: USER_ID, type: "extension_farm", amount: 800, createdAt: atUTC(9)  },
    { userId: USER_ID, type: "extension_farm", amount: 500, createdAt: atUTC(14) },
  ];

  const res = await prisma.pointEvent.createMany({ data });
  console.log("✅ Inserted events:", res);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
