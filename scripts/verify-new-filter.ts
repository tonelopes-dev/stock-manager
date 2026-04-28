import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const companyId = "rota-360-id";
  console.log(`--- VERIFICANDO ITENS NO ESTOQUE (LÓGICA NOVA) ---`);
  
  const products = await prisma.product.findMany({
    where: {
      companyId,
      OR: [
        { type: { in: ["INSUMO", "REVENDA"] } },
        { 
          type: "PRODUCAO_PROPRIA",
          isMadeToOrder: false
        }
      ]
    },
    select: { name: true, type: true, isMadeToOrder: true }
  });

  console.log(`Itens que aparecerão no estoque: ${products.length}`);
  products.forEach(p => console.log(`- ${p.name} | Tipo: ${p.type} | Feito na hora: ${p.isMadeToOrder}`));
}

main().finally(() => prisma.$disconnect());
