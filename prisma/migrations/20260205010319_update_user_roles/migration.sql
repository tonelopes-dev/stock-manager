/*
  Warnings:

  - The values [MEMBER] on the enum `UserRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserRole_new" AS ENUM ('OWNER', 'ADMIN', 'EMPLOYEE');
ALTER TABLE "UserCompany" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "UserCompany" ALTER COLUMN "role" TYPE "UserRole_new" USING ("role"::text::"UserRole_new");
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";
ALTER TABLE "UserCompany" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
COMMIT;

-- AlterTable
ALTER TABLE "UserCompany" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';
