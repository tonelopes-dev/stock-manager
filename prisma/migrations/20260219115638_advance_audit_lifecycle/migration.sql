/*
  Warnings:

  - The values [COMPANY_DELETED] on the enum `AuditEventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "AuditSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- AlterEnum
BEGIN;
CREATE TYPE "AuditEventType_new" AS ENUM ('OWNERSHIP_TRANSFERRED', 'COMPANY_SOFT_DELETED', 'COMPANY_RESTORED', 'COMPANY_PERMANENTLY_DELETED', 'MEMBER_INVITED', 'MEMBER_REMOVED', 'ROLE_UPDATED', 'STOCK_ADJUSTED', 'SALE_CANCELED', 'SUBSCRIPTION_ACTIVATED', 'SUBSCRIPTION_CANCELED', 'BILLING_REQUIRED', 'CHECKOUT_STARTED');
ALTER TABLE "AuditEvent" ALTER COLUMN "type" TYPE "AuditEventType_new" USING ("type"::text::"AuditEventType_new");
ALTER TYPE "AuditEventType" RENAME TO "AuditEventType_old";
ALTER TYPE "AuditEventType_new" RENAME TO "AuditEventType";
DROP TYPE "AuditEventType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "AuditEvent" DROP CONSTRAINT "AuditEvent_companyId_fkey";

-- DropIndex
DROP INDEX "AuditEvent_companyId_idx";

-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "actorEmail" TEXT,
ADD COLUMN     "actorName" TEXT,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityType" TEXT,
ADD COLUMN     "metadataVersion" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "severity" "AuditSeverity" NOT NULL DEFAULT 'INFO',
ALTER COLUMN "companyId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AuditEvent_companyId_createdAt_idx" ON "AuditEvent"("companyId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "Company_deletedAt_idx" ON "Company"("deletedAt");

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;
