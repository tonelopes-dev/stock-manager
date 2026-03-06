import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

async function main() {
  console.log('📡 Altering Enum StockMovementType...')
  try {
    await prisma.$executeRawUnsafe(`ALTER TYPE "StockMovementType" ADD VALUE 'ORDER'`)
    console.log('✅ Enum altered successfully.')
  } catch (e: any) {
    if (e.message.includes('already exists')) {
      console.log('ℹ️ Value already exists, skipping.')
    } else {
      console.error('❌ Error altering enum:', e.message)
    }
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
