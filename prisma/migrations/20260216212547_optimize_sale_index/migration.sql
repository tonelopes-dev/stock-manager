-- DropIndex
DROP INDEX "Sale_companyId_date_status_idx";

-- CreateIndex
CREATE INDEX "Sale_companyId_status_date_idx" ON "Sale"("companyId", "status", "date");
