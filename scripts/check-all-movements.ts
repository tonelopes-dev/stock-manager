import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const productId = "f4207eae-7099-45c1-b7a2-5ac709d31e4e";

  console.log(`Checking ALL movements for product ${productId}`);

  const movements = await prisma.stockMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${movements.length} movements.`);
  movements.forEach(m => {
    console.log(`- ${m.createdAt.toISOString()} | Type: ${m.type} | Qty: ${m.quantityDecimal} | Reason: ${m.reason}`);
  });
}

main().finally(() => prisma.$disconnect());
