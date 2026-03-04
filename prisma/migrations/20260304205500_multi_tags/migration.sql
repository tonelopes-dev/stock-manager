-- Step 1: Create the relation table
CREATE TABLE "_CustomerToCustomerCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Step 2: Create indexes for performance and uniqueness
CREATE UNIQUE INDEX "_CustomerToCustomerCategory_AB_unique" ON "_CustomerToCustomerCategory"("A", "B");
CREATE INDEX "_CustomerToCustomerCategory_B_index" ON "_CustomerToCustomerCategory"("B");

-- Step 3: Add foreign keys
ALTER TABLE "_CustomerToCustomerCategory" ADD CONSTRAINT "_CustomerToCustomerCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_CustomerToCustomerCategory" ADD CONSTRAINT "_CustomerToCustomerCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "CustomerCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 4: DATA MIGRATION - Perserve existing categories
INSERT INTO "_CustomerToCustomerCategory" ("A", "B")
SELECT id, "categoryId" FROM "Customer" WHERE "categoryId" IS NOT NULL;

-- Step 5: Update CustomerCategory with the new color column
ALTER TABLE "CustomerCategory" ADD COLUMN "color" TEXT;

-- Step 6: Cleanup - Drop the old column and its constraints
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_categoryId_fkey";
DROP INDEX IF EXISTS "Customer_companyId_categoryId_idx";
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "categoryId";
