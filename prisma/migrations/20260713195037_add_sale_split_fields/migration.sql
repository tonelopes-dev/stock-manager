-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "externalPaymentId" TEXT,
ADD COLUMN     "netAmount" DECIMAL(10,2),
ADD COLUMN     "paymentProvider" TEXT,
ADD COLUMN     "platformFeeAmount" DECIMAL(10,2),
ADD COLUMN     "platformFeeRate" DECIMAL(5,4);
