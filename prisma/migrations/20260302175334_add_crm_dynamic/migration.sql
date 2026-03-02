/*
  Warnings:

  - You are about to drop the column `category` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Goal` table. All the data in the column will be lost.
  - Added the required column `name` to the `Goal` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "CustomerCategoryEnum" AS ENUM ('LEAD', 'REGULAR', 'VIP', 'INACTIVE');

-- DropIndex
DROP INDEX "Customer_companyId_category_idx";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "oldCategory" "CustomerCategoryEnum" NOT NULL DEFAULT 'LEAD',
ADD COLUMN     "stageId" TEXT;

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "title",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ALTER COLUMN "endDate" DROP NOT NULL;

-- DropEnum
DROP TYPE "CustomerCategory";

-- CreateTable
CREATE TABLE "CustomerCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMStage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CRMStage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CustomerCategory_name_companyId_key" ON "CustomerCategory"("name", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CRMStage_name_companyId_key" ON "CRMStage"("name", "companyId");

-- CreateIndex
CREATE INDEX "Customer_companyId_categoryId_idx" ON "Customer"("companyId", "categoryId");

-- CreateIndex
CREATE INDEX "Customer_companyId_stageId_idx" ON "Customer"("companyId", "stageId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "CustomerCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "CRMStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCategory" ADD CONSTRAINT "CustomerCategory_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMStage" ADD CONSTRAINT "CRMStage_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
