
import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
import { recordStockMovement } from './app/_lib/stock';

async function main() {
  const saleId = '52de26d9-0d98-4ba3-8f19-17e387a8389f';
  const companyId = 'cle7h3mvw0000ux1c2b3d4e5f'; // I need to get the real companyId
  
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    include: { saleItems: true }
  });

  if (!sale) {
    console.log('Sale not found');
    return;
  }

  const userId = sale.userId;
  const cid = sale.companyId;

  console.log(`Attempting to cancel sale ${saleId} for company ${cid}`);

  try {
    await db.$transaction(async (trx) => {
      await trx.sale.update({
        where: { id: saleId },
        data: { status: 'CANCELED' }
      });

      for (const item of sale.saleItems) {
        console.log(`Reverting item ${item.productId}, quantity ${item.quantity}`);
        await recordStockMovement(
          {
            productId: item.productId,
            companyId: cid,
            userId: userId,
            type: 'CANCEL',
            quantity: Number(item.quantity),
            saleId: saleId,
            reason: 'Test cancellation'
          },
          trx
        );
      }
    });
    console.log('Cancellation successful!');
  } catch (err) {
    console.error('Cancellation FAILED:', err);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
