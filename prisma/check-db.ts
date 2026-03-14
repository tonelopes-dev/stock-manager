import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Category'
    `;
    console.log("Columns in Category table:", JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error("Error querying columns:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
