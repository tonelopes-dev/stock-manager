import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const name = "Cerveja Amstel 600ml";
  const companyId = "cmmkulmkn0002fkmxovod4s1d";

  console.log(`Searching for products named "${name}" in company ${companyId}`);

  const products = await prisma.product.findMany({
    where: {
      name: { contains: "Amstel", mode: 'insensitive' },
      companyId
    }
  });

  console.log(`Found ${products.length} matching products.`);
  products.forEach(p => {
    console.log(`- ID: ${p.id} | Name: ${p.name} | Stock: ${p.stock} | Type: ${p.type} | Active: ${p.isActive}`);
  });
}

main().finally(() => prisma.$disconnect());
