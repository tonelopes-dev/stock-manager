import { PrismaClient, ProductType } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log("--- INICIANDO LIMPEZA DE DADOS (MTO em Revenda/Insumo) ---");

  const inconsistentProducts = await prisma.product.findMany({
    where: {
      type: { in: [ProductType.REVENDA, ProductType.INSUMO] },
      isMadeToOrder: true,
    },
    select: { id: true, name: true, type: true }
  });

  console.log(`Encontrados ${inconsistentProducts.length} produtos inconsistentes.`);

  for (const product of inconsistentProducts) {
    await prisma.product.update({
      where: { id: product.id },
      data: { isMadeToOrder: false }
    });
    console.log(`✅ Corrigido: ${product.name} (${product.type})`);
  }

  console.log("--- LIMPEZA CONCLUÍDA ---");
}

main().finally(() => prisma.$disconnect());
