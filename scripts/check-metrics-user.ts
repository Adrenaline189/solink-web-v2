// scripts/check-metrics-user.ts
import { prisma } from "@/server/db";

async function main() {
  const userId = "u1";

  const hourly = await prisma.metricsHourly.findMany({
    where: { userId },
    orderBy: { hourUtc: "desc" },
    take: 10,
  });

  const daily = await prisma.metricsDaily.findMany({
    where: { userId },
    orderBy: { dayUtc: "desc" },
    take: 10,
  });

  console.log("=== Hourly metrics for", userId, "=== ");
  console.log(hourly);

  console.log("=== Daily metrics for", userId, "=== ");
  console.log(daily);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
