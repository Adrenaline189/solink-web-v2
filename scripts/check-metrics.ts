// scripts/check-metrics.ts
import { prisma } from "@/server/db";

async function main() {
  const lastHourly = await prisma.metricsHourly.findMany({
    orderBy: { hourUtc: "desc" },
    take: 10,
  });

  const lastDaily = await prisma.metricsDaily.findMany({
    orderBy: { dayUtc: "desc" },
    take: 5,
  });

  console.log("=== Last 10 hourly rows ===");
  console.log(lastHourly);

  console.log("=== Last 5 daily rows ===");
  console.log(lastDaily);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
