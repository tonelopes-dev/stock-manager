import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { getDashboardAnalytics } from '../app/_data-access/dashboard/get-dashboard-analytics';

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

// Mock getCurrentCompanyId to return rota-360-id for testing the service directly
jest.mock('../app/_lib/get-current-company', () => ({
  getCurrentCompanyId: () => Promise.resolve('rota-360-id')
}));

// Since I cannot easily use jest here, I will just call the underlying services directly
import { 
    getFinancialOverview, 
    getDailySalesChart, 
    getTopProfitableProducts,
    getWorstMarginProducts
} from '../app/_services/analytics';

async function main() {
  const companyId = 'rota-360-id';
  const now = new Date("2026-03-02T12:00:00Z");
  const end = new Date("2026-03-03T00:00:00Z");
  const start = new Date("2026-02-01T00:00:00Z");

  console.log("--- TESTING ANALYTICS SERVICES ---");
  console.log(`Range: ${start.toISOString()} to ${end.toISOString()}`);

  const overview = await getFinancialOverview(companyId, { startDate: start, endDate: end });
  console.log("Overview:", overview);

  const chart = await getDailySalesChart(companyId, { startDate: start, endDate: end });
  const hasData = chart.some(d => d.revenue > 0);
  console.log("Chart has data:", hasData);
  if (hasData) {
      console.log("Sample chart points:", chart.filter(d => d.revenue > 0).slice(0, 3));
  }

  const top = await getTopProfitableProducts(companyId, { startDate: start, endDate: end });
  console.log("Top products count:", top.length);
}

main().catch(console.error);
