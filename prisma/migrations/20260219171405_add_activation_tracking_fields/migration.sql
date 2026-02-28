-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "firstAlertSeenAt" TIMESTAMP(3),
ADD COLUMN     "firstProductAt" TIMESTAMP(3),
ADD COLUMN     "firstSaleAt" TIMESTAMP(3),
ADD COLUMN     "onboardingCompletedAt" TIMESTAMP(3);
