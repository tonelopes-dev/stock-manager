import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const id = "5d18cc9f-faaf-4660-b4f0-c0f2dae9bb86";
  const p = await prisma.product.findUnique({ where: { id } });
  console.log(`Product: ${p?.name} | isMadeToOrder: ${p?.isMadeToOrder}`);
}

main().finally(() => prisma.$disconnect());
