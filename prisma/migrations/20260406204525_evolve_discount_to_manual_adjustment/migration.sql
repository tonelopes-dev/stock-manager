/*
  Warnings:

  - You are about to drop the column `discountReason` on the `Order` table. All the data in the column will be lost.
  - You are about to drop the column `discountReason` on the `Sale` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "discountReason",
ADD COLUMN     "adjustmentReason" TEXT,
ADD COLUMN     "extraAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "discountReason",
ADD COLUMN     "adjustmentReason" TEXT,
ADD COLUMN     "extraAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;
