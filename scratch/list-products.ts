
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    take: 50,
    orderBy: { createdAt: "desc" }
  });
  console.log(`Last 50 products:`);
  products.forEach(p => {
    console.log(`- Name: "${p.name}", isMadeToOrder: ${p.isMadeToOrder}, Stock: ${p.stock}, Type: ${p.type}`);
  });
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
