import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('📡 Checking StockMovement columns...')
  const smCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'StockMovement'
  `)
  console.log('StockMovement Columns:', smCols.map(c => `${c.column_name} (${c.is_nullable})`).join(', '))

  console.log('\n📡 Checking Customer columns...')
  const cCols: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'Customer'
  `)
  console.log('Customer Columns:', cCols.map(c => `${c.column_name} (${c.is_nullable})`).join(', '))

  console.log('\n📡 Checking Customer constraints...')
  const cConstraints: any[] = await prisma.$queryRawUnsafe(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = '"Customer"'::regclass
  `)
  console.log('Customer Constraints:', cConstraints.map(c => c.conname).join(', '))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
