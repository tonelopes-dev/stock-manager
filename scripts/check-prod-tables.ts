import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('📡 Checking if tables exist...')
  const tables: any[] = await prisma.$queryRawUnsafe(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    AND table_name IN ('Order', 'OrderItem', 'ProductCategory', '_ProductToProductCategory', 'Sale')
  `)
  console.log('Tables present:', tables.map(t => t.table_name).join(', '))

  console.log('\n📡 Checking OrderStatus enum...')
  try {
    const enums: any[] = await prisma.$queryRawUnsafe(`
      SELECT item.enumlabel
      FROM pg_enum item
      JOIN pg_type typ ON item.enumtypid = typ.oid
      WHERE typ.typname = 'OrderStatus'
    `)
    console.log('OrderStatus values:', enums.map(e => e.enumlabel).join(', '))
  } catch (e) {
    console.log('OrderStatus enum not found.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
