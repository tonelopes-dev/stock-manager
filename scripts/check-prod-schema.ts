import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('📡 Checking Product table columns...')
  const columns: any[] = await prisma.$queryRawUnsafe(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'Product'
  `)
  console.log('Columns:', columns.map(c => c.column_name).join(', '))

  console.log('\n📡 Checking constraints on Product...')
  const constraints: any[] = await prisma.$queryRawUnsafe(`
    SELECT conname 
    FROM pg_constraint 
    WHERE conrelid = '"Product"'::regclass
  `)
  console.log('Constraints:', constraints.map(c => c.conname).join(', '))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
