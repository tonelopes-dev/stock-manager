import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

// Load .env
dotenv.config();

const prisma = new PrismaClient();
const productId = "f4207eae-7099-45c1-b7a2-5ac709d31e4e";

async function main() {
  console.log(`\n=== INVESTIGATING PRODUCT ID: ${productId} ===`);
  
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      parentCompositions: {
        include: {
          child: true
        }
      },
      childCompositions: {
        include: {
          parent: true
        }
      },
      stockMovements: {
        orderBy: { createdAt: 'desc' },
        take: 10
      }
    }
  });

  if (!product) {
    console.error("❌ Product not found!");
    return;
  }

  console.log("\n✅ Product Found:");
  console.log(JSON.stringify({
    id: product.id,
    name: product.name,
    type: product.type,
    stock: product.stock.toString(),
    isMadeToOrder: product.isMadeToOrder,
    companyId: product.companyId,
    unit: product.unit,
    isActive: product.isActive,
    updatedAt: product.updatedAt
  }, null, 2));

  console.log("\n📊 Recent Stock Movements (last 10):");
  if (product.stockMovements.length === 0) {
    console.log("No movements found.");
  } else {
    product.stockMovements.forEach(m => {
      console.log(`- ${m.createdAt.toISOString()} | Type: ${m.type.padEnd(10)} | Before: ${m.stockBefore.toString().padStart(8)} | After: ${m.stockAfter.toString().padStart(8)} | Qty: ${m.quantityDecimal?.toString().padStart(8)} | Reason: ${m.reason || 'N/A'}`);
    });
  }

  if (product.parentCompositions.length > 0) {
    console.log("\n📦 Ficha Técnica (Ingredients of this product):");
    product.parentCompositions.forEach(c => {
      console.log(`- Child Product: ${c.child.name} (${c.childId}) | Qty required: ${c.quantity}`);
    });
  }

  if (product.childCompositions.length > 0) {
    console.log("\n🔗 Used in (This product is an ingredient of):");
    product.childCompositions.forEach(c => {
      console.log(`- Parent Product: ${c.parent.name} (${c.parentId}) | Qty required: ${c.quantity}`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
