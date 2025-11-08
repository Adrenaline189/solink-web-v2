import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["warn", "error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL missing");
} else {
  console.log("✅ DATABASE_URL loaded:", process.env.DATABASE_URL.split("@")[1]?.slice(0, 30) + "…");
}
