-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "enableOverheadInjection" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "estimatedMonthlyVolume" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "operationalCost" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "FixedExpense" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FixedExpense_companyId_idx" ON "FixedExpense"("companyId");

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
