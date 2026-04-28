import { PrismaClient, ProductType } from "@prisma/client";
import * as dotenv from "dotenv";
import { IngredientService } from "../app/_services/ingredient";

dotenv.config();
const prisma = new PrismaClient();

async function reproduce() {
  const productId = "6ce71356-eff8-4f92-bd7d-6807246e566a"; // Coca-Cola 350ml
  const companyId = "rota-360-id";
  const userId = "cmnvy77pd00008m6puesfos6h";

  console.log("--- REPRODUZINDO BUG NO DOCKER ---");
  
  // 1. Configuração que causa o bug
  await prisma.product.update({
    where: { id: productId },
    data: {
      type: ProductType.REVENDA,
      isMadeToOrder: false
    }
  });
  console.log("Configuração aplicada: REVENDA + Feito na hora = OFF");

  // 2. Tentar o ajuste
  try {
    console.log("Tentando ajustar estoque...");
    const result = await IngredientService.adjustStock({
      ingredientId: productId,
      companyId,
      userId,
      quantity: 10,
      reason: "Teste Reprodução Local"
    });
    console.log("✅ Sucesso no ajuste. Resultado:", result.id);
  } catch (error: any) {
    console.error("❌ ERRO CAPTURADO:", error.message);
  }
}

reproduce().finally(() => prisma.$disconnect());
