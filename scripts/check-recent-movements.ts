import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const companyId = "cmmkulmkn0002fkmxovod4s1d";
  const since = new Date(Date.now() - 60 * 60 * 1000); // last 1h

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
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${movements.length} movements.`);
  movements.forEach(m => {
    console.log(`- ${m.createdAt.toISOString()} | Product: ${m.product?.name || 'N/A'} (${m.productId}) | Type: ${m.type} | Qty: ${m.quantityDecimal} | Reason: ${m.reason}`);
  });
}

main().finally(() => prisma.$disconnect());
