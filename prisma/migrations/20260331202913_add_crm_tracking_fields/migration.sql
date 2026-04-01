-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditEventType" ADD VALUE 'CUSTOMER_STAGE_UPDATED';
ALTER TYPE "AuditEventType" ADD VALUE 'CHECKLIST_ITEM_COMPLETED';

-- AlterTable
ALTER TABLE "ChecklistItem" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3);
