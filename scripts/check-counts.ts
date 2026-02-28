
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const saleCount = await prisma.sale.count()
    const productCount = await prisma.product.count()
    
    console.log('--- COUNTS START ---')
    console.log('Sales:', saleCount)
    console.log('Products:', productCount)
    console.log('--- COUNTS END ---')
  } catch (e) {
    console.error('Error fetching counts:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
