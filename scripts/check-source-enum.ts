import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('📡 Checking CustomerSource enum...')
  try {
    const enums: any[] = await prisma.$queryRawUnsafe(`
      SELECT item.enumlabel
      FROM pg_enum item
      JOIN pg_type typ ON item.enumtypid = typ.oid
      WHERE typ.typname = 'CustomerSource'
    `)
    console.log('CustomerSource values:', enums.map(e => e.enumlabel).join(', '))
  } catch (e) {
    console.log('CustomerSource enum not found.')
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
