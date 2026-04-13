
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  console.log("Current Company Settings:");
  console.log("Name:", company?.name);
  console.log("allowNegativeStock:", company?.allowNegativeStock);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
