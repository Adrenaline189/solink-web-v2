-- AlterTable
ALTER TABLE "MetricsDaily" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "version" TEXT;

-- AlterTable
ALTER TABLE "MetricsHourly" ADD COLUMN     "ip" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "version" TEXT;

-- AlterTable
ALTER TABLE "PointBalance" ADD COLUMN     "slk" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ReferralCode" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(6);

-- AddForeignKey
ALTER TABLE "PointBalance" ADD CONSTRAINT "PointBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
