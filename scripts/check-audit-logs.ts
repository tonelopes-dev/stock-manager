import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const companyId = "cmmkulmkn0002fkmxovod4s1d";
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  console.log(`Checking Audit Events for company ${companyId} since ${since.toISOString()}`);

  const events = await prisma.auditEvent.findMany({
    where: {
      companyId,
      type: "INGREDIENT_STOCK_ADJUSTED",
      createdAt: { gte: since }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`Found ${events.length} audit events.`);
  events.forEach(e => {
    console.log(`- ${e.createdAt.toISOString()} | Metadata: ${JSON.stringify(e.metadata)}`);
  });
}

main().finally(() => prisma.$disconnect());
