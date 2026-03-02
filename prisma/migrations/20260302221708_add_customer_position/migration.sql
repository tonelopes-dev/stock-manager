-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Customer_companyId_stageId_position_idx" ON "Customer"("companyId", "stageId", "position");
