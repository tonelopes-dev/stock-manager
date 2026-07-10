-- Convert the provider columns from the old PostgreSQL enum type to plain TEXT.
-- This is needed because the IntegrationProvider enum was removed from the Prisma schema.
-- Using USING clause to cast existing enum values to their text representation.

ALTER TABLE "PaymentIntent"
  ALTER COLUMN "provider" TYPE TEXT USING "provider"::TEXT;

ALTER TABLE "PaymentEvent"
  ALTER COLUMN "provider" TYPE TEXT USING "provider"::TEXT;

-- Drop the IntegrationProvider enum type from the database.
-- DROP IF EXISTS is safe — it won't fail if the enum was already removed.
DROP TYPE IF EXISTS "IntegrationProvider";
