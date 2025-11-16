// scripts/list-users.ts
import { prisma } from "@/server/db";

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    orderBy: { createdAt: "asc" },
  });

  console.log("=== Sample users in this DB ===");
  for (const u of users) {
    console.log({
      id: u.id,
      createdAt: u.createdAt,
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
