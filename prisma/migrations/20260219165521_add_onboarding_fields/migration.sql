-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "onboardingStep" INTEGER NOT NULL DEFAULT 0;
