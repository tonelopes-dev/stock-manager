
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('--- Inspecting PREPARED products ---');
  const preparedProducts = await prisma.product.findMany({
    where: { type: 'PREPARED' },
    select: { id: true, name: true, stock: true, cost: true, price: true }
  });
  
  if (preparedProducts.length === 0) {
    console.log('No PREPARED products found.');
  } else {
    preparedProducts.forEach(p => {
      console.log(`Product: ${p.id}, Name: ${p.name}, Stock: ${p.stock}, Cost: ${p.cost}, Price: ${p.price}`);
    });
  }

  console.log('\n--- Inspecting Sale that failed cancellation ---');
  const saleId = '52de26d9-0d98-4ba3-8f19-17e387a8389f';
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { saleItems: { include: { product: true } } }
  });

  if (sale) {
    console.log(`Sale ID: ${sale.id}, Status: ${sale.status}`);
    sale.saleItems.forEach(item => {
      console.log(`- Item: ${item.product.name} (${item.product.type}), Qty: ${item.quantity}, BaseCost: ${item.baseCost}`);
    });
  } else {
    console.log('Sale not found in DB.');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
