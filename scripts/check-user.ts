import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const m = await prisma.stockMovement.findFirst({
    where: {
      productId: "5d18cc9f-faaf-4660-b4f0-c0f2dae9bb86",
      type: "MANUAL"
    },
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  console.log(`Last manual movement for Agua Sem Gás:`);
  console.log(`User: ${m?.user?.name} (${m?.user?.email})`);
  console.log(`Time: ${m?.createdAt.toISOString()}`);
}

main().finally(() => prisma.$disconnect());
