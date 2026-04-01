/*
  Warnings:

  - The values [RESELL,PREPARED] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `stock` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.
  - You are about to alter the column `minStock` on the `Product` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `Decimal(10,4)`.
  - You are about to drop the column `ingredientId` on the `StockMovement` table. All the data in the column will be lost.
  - You are about to drop the `Ingredient` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProductRecipe` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('REVENDA', 'PRODUCAO_PROPRIA', 'COMBO', 'INSUMO');
ALTER TABLE "Product" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "Product" ALTER COLUMN "type" TYPE "ProductType_new" USING ("type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "ProductType_old";
ALTER TABLE "Product" ALTER COLUMN "type" SET DEFAULT 'REVENDA';
COMMIT;

-- DropForeignKey
ALTER TABLE "Ingredient" DROP CONSTRAINT "Ingredient_companyId_fkey";

-- DropForeignKey
ALTER TABLE "ProductRecipe" DROP CONSTRAINT "ProductRecipe_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "ProductRecipe" DROP CONSTRAINT "ProductRecipe_productId_fkey";

-- DropForeignKey
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_ingredientId_fkey";

-- DropIndex
DROP INDEX "StockMovement_ingredientId_idx";

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "type" SET DEFAULT 'REVENDA',
ALTER COLUMN "stock" SET DEFAULT 0,
ALTER COLUMN "stock" SET DATA TYPE DECIMAL(10,4),
ALTER COLUMN "minStock" SET DEFAULT 0,
ALTER COLUMN "minStock" SET DATA TYPE DECIMAL(10,4);

-- AlterTable
ALTER TABLE "StockMovement" DROP COLUMN "ingredientId";

-- DropTable
DROP TABLE "Ingredient";

-- DropTable
DROP TABLE "ProductRecipe";

-- CreateTable
CREATE TABLE "ProductComposition" (
    "id" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "childId" TEXT NOT NULL,
    "quantity" DECIMAL(10,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductComposition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductComposition_parentId_childId_key" ON "ProductComposition"("parentId", "childId");

-- AddForeignKey
ALTER TABLE "ProductComposition" ADD CONSTRAINT "ProductComposition_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductComposition" ADD CONSTRAINT "ProductComposition_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
