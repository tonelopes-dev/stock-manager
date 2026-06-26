-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'SETTLED_LATER';

-- AlterEnum
ALTER TYPE "SaleStatus" ADD VALUE 'PENDING_PAYMENT';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "dueDate" TIMESTAMP(3);
