import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const companyId = "cmmkulmkn0002fkmxovod4s1d";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

  console.log(`Checking MANUAL movements for company ${companyId} since ${since.toISOString()}`);

  const movements = await prisma.stockMovement.findMany({
    where: {
      companyId,
      type: "MANUAL",
      createdAt: { gte: since }
    },
    include: {
      product: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${movements.length} manual movements.`);
  movements.forEach(m => {
    console.log(`- ${m.createdAt.toISOString()} | Product: ${m.product?.name || 'N/A'} (${m.productId}) | Qty: ${m.quantityDecimal} | Reason: ${m.reason}`);
  });
}

main().finally(() => prisma.$disconnect());
