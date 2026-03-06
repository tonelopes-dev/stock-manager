import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name = 'Company' AND column_name IN ('isBoletoPending', 'stripeInvoiceUrl');`
    console.log('Company columns:', (cols as any).map((c: any) => c.column_name))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
