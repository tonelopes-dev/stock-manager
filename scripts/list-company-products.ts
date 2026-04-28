import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const companyId = "cmmkulmkn0002fkmxovod4s1d";
  const count = await prisma.product.count({ where: { companyId } });
  console.log(`Products in company ${companyId}: ${count}`);
  
  if (count > 0) {
    const products = await prisma.product.findMany({
      where: { companyId },
      take: 10,
      select: { id: true, name: true }
    });
    products.forEach(p => console.log(`- ${p.name} (${p.id})`));
  }
}

main().finally(() => prisma.$disconnect());
