-- Add Mercado Pago columns safely to any environment without breaking if they already exist
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "mpMarketplaceAccountId" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "mpMarketplaceToken" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "mpMarketplacePublicKey" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "mpCheckoutEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "kipoMarketplaceFeeRate" DECIMAL(5,4);
