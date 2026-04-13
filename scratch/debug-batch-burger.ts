
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const products = await prisma.product.findMany({
    where: { name: { contains: "BATCH Burger" } }
  });
  console.log(`Found ${products.length} BATCH products:`);
  products.forEach(p => {
    console.log(`- Name: ${p.name}, isMadeToOrder: ${p.isMadeToOrder}, Stock: ${p.stock}`);
  });
  
  const mtoProducts = await prisma.product.findMany({
    where: { name: { contains: "MTO Burger" } }
  });
  console.log(`\nFound ${mtoProducts.length} MTO products:`);
  mtoProducts.forEach(p => {
    console.log(`- Name: ${p.name}, isMadeToOrder: ${p.isMadeToOrder}, Stock: ${p.stock}`);
  });
  
  const company = await prisma.company.findFirst();
  console.log("\nCompany Settings:");
  console.log("allowNegativeStock:", company?.allowNegativeStock);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
