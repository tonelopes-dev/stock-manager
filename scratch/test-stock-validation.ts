
import { db } from "../app/_lib/prisma";
import { processRecursiveStockMovement } from "../app/_lib/stock";
import { BusinessError } from "../app/_lib/errors";
import { Prisma } from "@prisma/client";

async function testBatchStockValidation() {
  console.log("--- Starting Batch Stock Validation Test ---");
  
  const timestamp = "debug_test";
  const companyId = (await db.company.findFirst())?.id;
  
  if (!companyId) {
    console.error("No company found");
    return;
  }

  // 1. Ensure company has allowNegativeStock = false
  await db.company.update({
    where: { id: companyId },
    data: { allowNegativeStock: false }
  });
  console.log("Company allowNegativeStock set to FALSE");

  // 2. Create a Batch product with 0 stock
  const product = await db.product.create({
    data: {
      name: `BATCH DEBUG ${Date.now()}`,
      price: 10,
      cost: 5,
      stock: 0,
      isMadeToOrder: false,
      companyId: companyId,
      type: "PRODUCAO_PROPRIA",
      unit: "UN",
    }
  });
  console.log(`Created product: ${product.name}, isMadeToOrder: ${product.isMadeToOrder}, Stock: ${product.stock}`);

  // 3. Try to record movement of -1 recursively
  try {
    await db.$transaction(async (trx) => {
      console.log("Attempting processRecursiveStockMovement with forceAllowNegative=false...");
      await processRecursiveStockMovement(
        {
          productId: product.id,
          quantity: new Prisma.Decimal("-1"),
          companyId,
          type: "SALE",
          forceAllowNegative: false,
        },
        trx
      );
    });
    console.error("FAIL: Expected BusinessError 'Estoque insuficiente' but it succeeded!");
  } catch (error) {
    if (error instanceof BusinessError) {
      console.log("SUCCESS: Caught expected BusinessError:", error.message);
    } else {
      console.error("FAIL: Caught unexpected error:", error);
    }
  }

  // 4. Try with forceAllowNegative=true
  try {
    await db.$transaction(async (trx) => {
      console.log("Attempting processRecursiveStockMovement with forceAllowNegative=true...");
      await processRecursiveStockMovement(
        {
          productId: product.id,
          quantity: new Prisma.Decimal("-1"),
          companyId,
          type: "SALE",
          forceAllowNegative: true,
        },
        trx
      );
    });
    console.log("SUCCESS: Allowed negative stock as expected with forceAllowNegative=true");
  } catch (error) {
    console.error("FAIL: Should have allowed negative stock:", error);
  }
}

testBatchStockValidation()
  .catch(console.error)
  .finally(() => db.$disconnect());
