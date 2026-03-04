const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    const sql = `
-- Step 1: Create the relation table
CREATE TABLE IF NOT EXISTS "_CustomerToCustomerCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Step 2: Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS "_CustomerToCustomerCategory_AB_unique" ON "_CustomerToCustomerCategory"("A", "B");
CREATE INDEX IF NOT EXISTS "_CustomerToCustomerCategory_B_index" ON "_CustomerToCustomerCategory"("B");

-- Step 3: Add foreign keys
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_CustomerToCustomerCategory_A_fkey') THEN
        ALTER TABLE "_CustomerToCustomerCategory" ADD CONSTRAINT "_CustomerToCustomerCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '_CustomerToCustomerCategory_B_fkey') THEN
        ALTER TABLE "_CustomerToCustomerCategory" ADD CONSTRAINT "_CustomerToCustomerCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "CustomerCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 4: DATA MIGRATION
INSERT INTO "_CustomerToCustomerCategory" ("A", "B")
SELECT id, "categoryId" FROM "Customer" 
WHERE "categoryId" IS NOT NULL 
AND NOT EXISTS (
    SELECT 1 FROM "_CustomerToCustomerCategory" 
    WHERE "A" = "Customer".id AND "B" = "Customer"."categoryId"
);

-- Step 5: Update CustomerCategory
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='CustomerCategory' AND column_name='color') THEN
        ALTER TABLE "CustomerCategory" ADD COLUMN "color" TEXT;
    END IF;
END $$;

-- Step 6: Cleanup
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_categoryId_fkey";
DROP INDEX IF EXISTS "Customer_companyId_categoryId_idx";
-- Note: We wait to drop the column manually if needed, but let's do it now if we are sure.
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "categoryId";
`;

    await client.query(sql);
    console.log('Migration SQL applied successfully');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.end();
  }
}

migrate();
