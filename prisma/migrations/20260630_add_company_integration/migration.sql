-- CreateEnum
CREATE TYPE "IntegrationProvider" AS ENUM ('INFINITYPAY', 'IFOOD', 'WHATSAPP_BUSINESS');

-- CreateTable
CREATE TABLE "CompanyIntegration" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "provider" "IntegrationProvider" NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "credentials" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CompanyIntegration_companyId_idx" ON "CompanyIntegration"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyIntegration_companyId_provider_key" ON "CompanyIntegration"("companyId", "provider");

-- AddForeignKey
ALTER TABLE "CompanyIntegration" ADD CONSTRAINT "CompanyIntegration_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
