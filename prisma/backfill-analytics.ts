import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function backfill() {
  console.log("🏁 Starting data backfill for analytics fields...");

  const sales = await prisma.sale.findMany({
    include: {
      saleItems: true,
    },
  });

  console.log(`📊 Found ${sales.length} sales to process.`);

  for (let i = 0; i < sales.length; i++) {
    const sale = sales[i];
    let saleTotalAmount = 0;
    let saleTotalCost = 0;

    // Process each item in the sale
    for (const item of sale.saleItems) {
      const itemTotalAmount = Number(item.unitPrice) * Number(item.quantity);
      const itemTotalCost = Number(item.baseCost) * Number(item.quantity);

      await prisma.saleItem.update({
        where: { id: item.id },
        data: {
          totalAmount: itemTotalAmount,
          totalCost: itemTotalCost,
          discountAmount: 0,
        },
      });

      saleTotalAmount += itemTotalAmount;
      saleTotalCost += itemTotalCost;
    }

    // Update the sale totals
    await prisma.sale.update({
      where: { id: sale.id },
      data: {
        totalAmount: saleTotalAmount,
        totalCost: saleTotalCost,
        discountAmount: 0,
      },
    });

    if ((i + 1) % 10 === 0 || i === sales.length - 1) {
      console.log(`⏳ Progress: ${i + 1}/${sales.length} sales processed...`);
    }
  }

  console.log("✅ Backfill completed successfully.");
}

backfill()
  .catch((e) => {
    console.error("❌ Backfill failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
