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
      console.log(`Loaded env from ${envPath}`);
      return;
    }
  }
}

loadEnv();

const prisma = new PrismaClient();

async function main() {
  console.log("--- DEBUG START ---");
  console.log("DATABASE_URL present:", !!process.env.DATABASE_URL);
  
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  console.log("Companies found in DB:", companies);

  if (companies.length === 0) {
    console.log("❌ No companies found in DB. Seed might have failed or pointed to wrong DB.");
    return;
  }

  const userCompanies = await prisma.userCompany.findMany({ 
    include: { company: true, user: true }
  });
  console.log("User-Company relations:", userCompanies.map(uc => ({
    userName: uc.user.name,
    companyName: uc.company.name,
    companyId: uc.companyId
  })));

  const salesCount = await prisma.sale.count();
  console.log("Total Sales count in DB:", salesCount);

  const sampleSales = await prisma.sale.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    select: { companyId: true, date: true, status: true }
  });
  console.log("Latest Sales samples:", sampleSales);

  const now = new Date();
  console.log("Current system date (now):", now.toISOString());

  // Check chart-specific counts for the first company
  const companyId = companies[0]?.id; 
  if (companyId) {
    // Range logic from get-dashboard-analytics.ts
    const endOfCurrentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const daysCount = 30; // 30d default
    const startOfCurrentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (daysCount - 1));
    
    console.log(`Checking 30d range for ${companies[0].name} (${companyId}):`);
    console.log(`Start: ${startOfCurrentDate.toISOString()}`);
    console.log(`End: ${endOfCurrentDate.toISOString()}`);

    const filteredSales = await prisma.sale.count({
      where: {
        companyId,
        date: { gte: startOfCurrentDate, lt: endOfCurrentDate },
        status: 'ACTIVE'
      }
    });
    console.log(`Sales in 30d range:`, filteredSales);

    // If 0, check wider range
    if (filteredSales === 0) {
      const allSales = await prisma.sale.findMany({
        where: { companyId },
        select: { date: true },
        take: 10,
        orderBy: { date: 'desc' }
      });
      console.log(`Actually found these sales for company:`, allSales.map(s => s.date.toISOString()));
    }
  }

  console.log("--- DEBUG END ---");
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
