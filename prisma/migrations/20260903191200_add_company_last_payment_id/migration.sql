-- Migration: add_company_last_payment_id
-- Adds lastPaymentId to the Company table.
-- Prevents duplicate MercadoPago webhook deliveries from crediting extra months.

ALTER TABLE "Company" ADD COLUMN "lastPaymentId" TEXT;
