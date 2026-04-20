import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking for exact duplicates...");
  const exact = await prisma.$queryRaw`
    SELECT name, "companyId", COUNT(*) 
    FROM "Product" 
    GROUP BY name, "companyId" 
    HAVING COUNT(*) > 1
  `;
  console.log("Exact Duplicates:", exact);

  console.log("\nChecking for duplicates with trailing/leading spaces...");
  const trimmed = await prisma.$queryRaw`
    SELECT TRIM(name) as trimmed_name, "companyId", COUNT(*) 
    FROM "Product" 
    GROUP BY TRIM(name), "companyId" 
    HAVING COUNT(*) > 1
  `;
  console.log("Trimmed Duplicates:", trimmed);
}

main().finally(() => prisma.$disconnect());
