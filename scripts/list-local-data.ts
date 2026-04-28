import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log("--- BASE LOCAL (DOCKER) ---");
  const products = await prisma.product.findMany({
    take: 10,
    select: { id: true, name: true, type: true, isMadeToOrder: true, companyId: true }
  });
  
  if (products.length === 0) {
    console.log("Banco local está vazio. Vou precisar criar um produto de teste.");
  } else {
    console.log(`Encontrados ${products.length} produtos:`);
    products.forEach(p => console.log(`- ${p.name} (${p.id}) | Tipo: ${p.type} | Feito na hora: ${p.isMadeToOrder}`));
  }
}

main().finally(() => prisma.$disconnect());
