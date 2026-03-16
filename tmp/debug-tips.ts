import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Debugging Tips ---')
  
  const salesWithTips = await prisma.sale.findMany({
    where: {
      tipAmount: { gt: 0 }
    },
    select: {
      id: true,
      tipAmount: true,
      totalAmount: true,
      status: true,
      date: true,
      companyId: true,
      _count: {
        select: { saleItems: true }
      }
    }
  })

  console.log(`Found ${salesWithTips.length} sales with tips.`)
  salesWithTips.forEach(s => {
    console.log(`ID: ${s.id} | Tip: ${s.tipAmount} | Total: ${s.totalAmount} | Items: ${s._count.saleItems} | Status: ${s.status} | Date: ${s.date}`)
  })

  // Check a specific company if possible
  if (salesWithTips.length > 0) {
      const companyId = salesWithTips[0].companyId;
      console.log(`\nChecking metrics for company: ${companyId}`);
      
      const start = new Date('2024-01-01');
      const end = new Date('2027-01-01');

      const tipsSum = await prisma.sale.aggregate({
          where: {
              companyId,
              status: 'ACTIVE',
              date: { gte: start, lt: end }
          },
          _sum: {
              tipAmount: true
          }
      });
      console.log(`Aggregated tips (Total): ${tipsSum._sum.tipAmount}`);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
