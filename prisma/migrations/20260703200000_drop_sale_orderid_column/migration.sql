-- DropForeignKey
ALTER TABLE "Sale" DROP CONSTRAINT "Sale_orderId_fkey";

-- DropIndex
DROP INDEX "Sale_orderId_key";

-- AlterTable
ALTER TABLE "Sale" DROP COLUMN "orderId";
