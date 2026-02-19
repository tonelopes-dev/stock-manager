/*
  Warnings:

  - You are about to alter the column `quantity` on the `SaleProduct` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,3)`.
  - You are about to alter the column `stockBefore` on the `StockMovement` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.
  - You are about to alter the column `stockAfter` on the `StockMovement` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.
  - Added the required column `unit` to the `ProductRecipe` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "ProductRecipe" ADD COLUMN     "unit" "UnitType" NOT NULL;

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "discountAmount" DECIMAL(10,2),
ADD COLUMN     "totalAmount" DECIMAL(10,2),
ADD COLUMN     "totalCost" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "SaleProduct" ADD COLUMN     "discountAmount" DECIMAL(10,2),
ADD COLUMN     "totalAmount" DECIMAL(10,2),
ADD COLUMN     "totalCost" DECIMAL(10,2),
ALTER COLUMN "quantity" SET DATA TYPE DECIMAL(10,3);

-- AlterTable
ALTER TABLE "StockMovement" ALTER COLUMN "stockBefore" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "stockAfter" SET DATA TYPE DECIMAL(10,4);

-- CreateIndex
CREATE INDEX "Sale_companyId_date_status_idx" ON "Sale"("companyId", "date", "status");

-- CreateIndex
CREATE INDEX "Sale_companyId_createdAt_idx" ON "Sale"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "SaleProduct_saleId_idx" ON "SaleProduct"("saleId");

-- CreateIndex
CREATE INDEX "SaleProduct_productId_idx" ON "SaleProduct"("productId");
