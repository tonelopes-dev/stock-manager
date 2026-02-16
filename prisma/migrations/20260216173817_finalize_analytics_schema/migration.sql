/*
  Warnings:

  - Made the column `discountAmount` on table `Sale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `Sale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalCost` on table `Sale` required. This step will fail if there are existing NULL values in that column.
  - Made the column `discountAmount` on table `SaleProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalAmount` on table `SaleProduct` required. This step will fail if there are existing NULL values in that column.
  - Made the column `totalCost` on table `SaleProduct` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Sale" ALTER COLUMN "discountAmount" SET NOT NULL,
ALTER COLUMN "discountAmount" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET NOT NULL,
ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "totalCost" SET NOT NULL,
ALTER COLUMN "totalCost" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "SaleProduct" ALTER COLUMN "discountAmount" SET NOT NULL,
ALTER COLUMN "discountAmount" SET DEFAULT 0,
ALTER COLUMN "totalAmount" SET NOT NULL,
ALTER COLUMN "totalAmount" SET DEFAULT 0,
ALTER COLUMN "totalCost" SET NOT NULL,
ALTER COLUMN "totalCost" SET DEFAULT 0;
