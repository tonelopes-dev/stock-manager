import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPaths = ['.env.local', '.env'];
  for (const envPath of envPaths) {
    const fullPath = path.resolve(process.cwd(), envPath);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (const line of lines) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          let value = valueParts.join('=').trim();
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key.trim()] = value;
        }
      }
      return;
    }
  }
}

loadEnv();
const prisma = new PrismaClient();

async function main() {
  const companyId = 'rota-360-id';
  const start = new Date("2026-02-01T00:00:00Z");
  const end = new Date("2026-03-03T00:00:00Z");

  console.log("--- RAW SQL DATA TEST ---");
  
  const results = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', s."date") as day,
      SUM(si."unitPrice" * si."quantity") as revenue,
      SUM(si."baseCost" * si."quantity") as cogs
    FROM "SaleProduct" si
    JOIN "Sale" s ON s.id = si."saleId"
    WHERE s."companyId" = ${companyId}
      AND s."status" = 'ACTIVE'
      AND s."date" >= ${start}
      AND s."date" < ${end}
    GROUP BY day
    ORDER BY day ASC;
  `;

  console.log("Raw SQL results count:", (results as any[]).length);
  if ((results as any[]).length > 0) {
    console.log("First 3 results:", (results as any[]).slice(0, 3));
  } else {
      console.log("No results from Raw SQL query.");
  }
}

main().finally(() => prisma.$disconnect());
