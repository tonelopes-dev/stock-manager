/*
  Warnings:

  - You are about to drop the column `maxProducts` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `maxUsers` on the `Company` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `Company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Company" DROP COLUMN "maxProducts",
DROP COLUMN "maxUsers",
DROP COLUMN "plan";

-- DropEnum
DROP TYPE "Plan";
