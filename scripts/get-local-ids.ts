import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  const product = await prisma.product.findUnique({
    where: { id: "6ce71356-eff8-4f92-bd7d-6807246e566a" }
  });

  console.log("User Local:", user?.id);
  console.log("Company ID Product:", product?.companyId);
}

main().finally(() => prisma.$disconnect());
