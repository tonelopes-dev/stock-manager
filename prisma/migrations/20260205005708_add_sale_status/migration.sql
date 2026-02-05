-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('ACTIVE', 'CANCELED');

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "status" "SaleStatus" NOT NULL DEFAULT 'ACTIVE';
