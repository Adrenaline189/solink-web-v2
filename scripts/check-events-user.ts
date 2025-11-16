// scripts/check-events-user.ts
import { prisma } from "@/server/db";

async function main() {
  const userId = "u1";

  const events = await prisma.pointEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  console.log("=== pointEvent for", userId, "=== ");
  console.log(events);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
