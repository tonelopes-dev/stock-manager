-- Drop the legacy CompanyIntegration table safely.
-- This table was replaced by the native MP OAuth fields on the Company model.
DROP TABLE IF EXISTS "CompanyIntegration";
