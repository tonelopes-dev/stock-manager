/*
  Warnings:

  - A unique constraint covering the columns `[sku,companyId]` on the table `Product` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" TEXT,
ADD COLUMN     "cost" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "minStock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sku" TEXT,
ALTER COLUMN "stock" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_companyId_key" ON "Product"("sku", "companyId");
