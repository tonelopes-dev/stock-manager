/*
  Warnings:

  - You are about to drop the column `businessType` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `firstAlertSeenAt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `firstProductAt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `firstSaleAt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `onboardingCompletedAt` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `onboardingStep` on the `Company` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CustomerCategory" AS ENUM ('LEAD', 'REGULAR', 'VIP', 'INACTIVE');

-- CreateEnum
CREATE TYPE "CustomerSource" AS ENUM ('MANUAL', 'IFOOD', 'WHATSAPP', 'WEBSITE', 'OTHER');

-- CreateEnum
CREATE TYPE "GoalType" AS ENUM ('GLOBAL', 'PRODUCT');

-- CreateEnum
CREATE TYPE "GoalPeriod" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');

-- AlterTable
ALTER TABLE "Company" DROP COLUMN "businessType",
DROP COLUMN "firstAlertSeenAt",
DROP COLUMN "firstProductAt",
DROP COLUMN "firstSaleAt",
DROP COLUMN "onboardingCompletedAt",
DROP COLUMN "onboardingStep";

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "customerId" TEXT;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "category" "CustomerCategory" NOT NULL DEFAULT 'LEAD',
    "source" "CustomerSource" NOT NULL DEFAULT 'MANUAL',
    "externalId" TEXT,
    "birthday" TIMESTAMP(3),
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "GoalType" NOT NULL,
    "period" "GoalPeriod" NOT NULL DEFAULT 'MONTHLY',
    "targetValue" DECIMAL(10,2) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "companyId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_companyId_category_idx" ON "Customer"("companyId", "category");

-- CreateIndex
CREATE INDEX "Customer_companyId_birthday_idx" ON "Customer"("companyId", "birthday");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_email_companyId_key" ON "Customer"("email", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_companyId_key" ON "Customer"("phone", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_externalId_source_companyId_key" ON "Customer"("externalId", "source", "companyId");

-- CreateIndex
CREATE INDEX "Goal_companyId_startDate_endDate_idx" ON "Goal"("companyId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Goal_companyId_productId_idx" ON "Goal"("companyId", "productId");

-- CreateIndex
CREATE INDEX "Goal_companyId_type_isActive_idx" ON "Goal"("companyId", "type", "isActive");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
