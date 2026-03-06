import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const cols = await prisma.$queryRaw`SELECT is_nullable FROM information_schema.columns WHERE table_name = 'StockMovement' AND column_name = 'userId';`
    console.log('StockMovement userId is_nullable:', (cols as any)[0].is_nullable)
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
