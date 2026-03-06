import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const enumValues = await prisma.$queryRaw`SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname = 'CustomerSource';`
    console.log('CustomerSource values:' + JSON.stringify((enumValues as any).map((v: any) => v.enumlabel)))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
