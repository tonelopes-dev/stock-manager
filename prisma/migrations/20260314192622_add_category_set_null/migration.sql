-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "icon" TEXT,
ADD COLUMN     "orderIndex" INTEGER NOT NULL DEFAULT 0;
