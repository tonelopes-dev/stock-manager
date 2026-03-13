-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'INGREDIENT_CREATED';
ALTER TYPE "AuditEventType" ADD VALUE 'INGREDIENT_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'INGREDIENT_DELETED';
ALTER TYPE "AuditEventType" ADD VALUE 'INGREDIENT_STOCK_ADJUSTED';

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "unit" "UnitType" NOT NULL DEFAULT 'UN';

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "unit" "UnitType";
