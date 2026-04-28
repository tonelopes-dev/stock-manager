import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const companyId = "cmmkulmkn0002fkmxovod4s1d";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  console.log(`Checking ALL movements for company ${companyId} since ${since.toISOString()}`);

  const movements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      createdAt: { gte: since }
    },
    include: {
      product: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  console.log(`Found ${movements.length} movements.`);
  movements.forEach(m => {
    console.log(`- ${m.createdAt.toISOString()} | Product: ${m.product?.name || 'N/A'} (${m.productId}) | Type: ${m.type} | Qty: ${m.quantityDecimal} | Reason: ${m.reason}`);
  });
}

main().finally(() => prisma.$disconnect());
