import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public';`
    console.log('Tables:', (tables as any).map((t: any) => t.tablename))

    const enums = await prisma.$queryRaw`SELECT typname FROM pg_type WHERE typcategory = 'E';`
    console.log('Enums:', (enums as any).map((e: any) => e.typname))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
