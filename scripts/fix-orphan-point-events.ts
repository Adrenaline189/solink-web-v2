// scripts/fix-orphan-point-events.ts
import "dotenv/config";
import { prisma } from "@/server/db";

async function main() {
  console.log("🔍 Checking orphan pointEvent.userId ...");

  // 1) ดึง userId ที่มีอยู่จริงในตาราง User
  const users = await prisma.user.findMany({
    select: { id: true },
  });

  const existing = new Set<string>(users.map((u) => u.id));
  console.log(`👥 Users in table: ${users.length}`);

  // 2) ดึง userId ที่ใช้ใน PointEvent (ปล่อยให้มี null ได้ แล้วค่อยกรองทีหลัง)
  const distinctUserIds = await prisma.pointEvent.findMany({
    distinct: ["userId"],
    select: { userId: true },
  });

  console.log(
    `📊 Distinct userId in PointEvent: ${distinctUserIds.length}`
  );

  // 3) หา userId ที่ไม่มีในตาราง User → orphan
  const orphanIds: string[] = distinctUserIds
    .map((r: { userId: string | null }) => r.userId)
    .filter((id: string | null): id is string => !!id && !existing.has(id));

  console.log("🧾 Orphan userIds =", orphanIds);

  if (orphanIds.length === 0) {
    console.log("✅ No orphan PointEvent rows. Nothing to delete.");
    return;
  }

  // 4) ลบ PointEvent ที่ userId เป็น orphan
  const deleted = await prisma.pointEvent.deleteMany({
    where: {
      userId: { in: orphanIds },
    },
  });

  console.log(
    `🧹 Deleted ${deleted.count} PointEvent rows for orphan userIds.`
  );
}

main()
  .catch((e) => {
    console.error("fix-orphan-point-events error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
