import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const productId = "f4207eae-7099-45c1-b7a2-5ac709d31e4e";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  console.log(`Checking Stock Entries for product ${productId} since ${since.toISOString()}`);

  const entries = await prisma.stockEntry.findMany({
    where: {
      productId,
      createdAt: { gte: since }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${entries.length} entries.`);
  entries.forEach(e => {
    console.log(`- ${e.createdAt.toISOString()} | Qty: ${e.quantity} | Cost: ${e.unitCost}`);
  });
}

main().finally(() => prisma.$disconnect());
