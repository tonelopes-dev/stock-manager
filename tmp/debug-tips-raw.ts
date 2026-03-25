import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('--- Raw SQL Debugging Tips ---')
  
  try {
    const result = await prisma.$queryRawUnsafe(`
      SELECT id, "tipAmount", "totalAmount", status, date, "companyId"
      FROM "Sale"
      WHERE "tipAmount" > 0
      LIMIT 10;
    `)

    console.log('Query result:', JSON.stringify(result, null, 2))
    
    // Also check total sum across all companies
    const sumResult = await prisma.$queryRawUnsafe(`
      SELECT SUM("tipAmount") as total_tips FROM "Sale";
    `)
    console.log('Sum result:', JSON.stringify(sumResult, null, 2))

  } catch (err) {
    console.error('Error executing raw query:', err)
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
