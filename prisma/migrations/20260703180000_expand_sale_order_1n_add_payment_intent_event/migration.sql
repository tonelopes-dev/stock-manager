-- Migration: expand_sale_order_1n_add_payment_intent_event
-- Phase 1: Expand Sale→Order relation from 1:1 to 1:N
-- and introduce PaymentIntent and PaymentEvent tables.
-- The old Sale.orderId column is KEPT intentionally during this phase.
-- It will only be removed after the code backfill is confirmed.

-- Step 1: Add saleId to Order (the new FK pointing to Sale)
ALTER TABLE "Order" ADD COLUMN "saleId" TEXT;

-- Step 2: Backfill saleId from the existing 1:1 relation (Sale.orderId → Order.id)
UPDATE "Order" o
SET "saleId" = s.id
FROM "Sale" s
WHERE s."orderId" = o.id;

-- Step 3: Add FK constraint and index for the new saleId column
ALTER TABLE "Order" ADD CONSTRAINT "Order_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Order_saleId_idx" ON "Order"("saleId");

-- Step 4: Create PaymentIntentStatus enum
CREATE TYPE "PaymentIntentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'EXPIRED');

-- Step 5: Create PaymentIntent table
CREATE TABLE "PaymentIntent" (
    "id"          TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "customerId"  TEXT,
    "orderIds"    TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "amount"      DECIMAL(10,2) NOT NULL,
    "status"      "PaymentIntentStatus" NOT NULL DEFAULT 'PENDING',
    "provider"    "IntegrationProvider" NOT NULL,
    "externalId"  TEXT,
    "checkoutUrl" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentIntent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentIntent_companyId_idx" ON "PaymentIntent"("companyId");
CREATE INDEX "PaymentIntent_externalId_idx" ON "PaymentIntent"("externalId");

-- Step 6: Create PaymentEvent table (for webhook idempotency)
CREATE TABLE "PaymentEvent" (
    "id"          TEXT NOT NULL,
    "companyId"   TEXT NOT NULL,
    "provider"    "IntegrationProvider" NOT NULL,
    "eventType"   TEXT NOT NULL,
    "status"      TEXT NOT NULL,
    "payload"     JSONB NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PaymentEvent_companyId_idx" ON "PaymentEvent"("companyId");
