import { PrismaClient, ProductType } from "@prisma/client";
import * as dotenv from "dotenv";
import { IngredientService } from "../app/_services/ingredient";

dotenv.config();
const prisma = new PrismaClient();

async function diagnose() {
  const companyId = "rota-360-id";
  const userId = "cmnvy77pd00008m6puesfos6h";
  
  // 1. Criar ou encontrar um produto REVENDA com MTO=false
  console.log("Configurando produto de teste...");
  let product = await prisma.product.findFirst({
    where: { 
      type: ProductType.REVENDA,
      isMadeToOrder: false,
      companyId 
    }
  });

  if (!product) {
    console.log("Nenhum produto com essa config encontrado, criando um...");
    product = await prisma.product.create({
      data: {
        name: "Produto Teste Bug",
        type: ProductType.REVENDA,
        isMadeToOrder: false,
        price: 10,
        companyId,
        stock: 5,
        unit: "UN"
      }
    });
  }

  console.log(`Testando com Produto: ${product.name} (ID: ${product.id})`);
  console.log(`Estoque atual no banco: ${product.stock}`);

  try {
    console.log("Executando ajuste de +10...");
    const movement = await IngredientService.adjustStock({
      ingredientId: product.id,
      companyId,
      userId,
      quantity: 10,
      reason: "Teste Diagnóstico"
    });

    // 3. Verificar se o estoque no produto REALMENTE mudou
    const updatedProduct = await prisma.product.findUnique({
      where: { id: product.id }
    });

    console.log("✅ Movimentação criada:", movement.id);
    console.log("✅ Estoque após ajuste no banco:", updatedProduct?.stock.toString());

    if (Number(updatedProduct?.stock) === Number(product.stock) + 10) {
      console.log(">>> O BACKEND ESTÁ FUNCIONANDO CORRETAMENTE. O PROBLEMA É NA UI OU NO CACHE.");
    } else {
      console.error(">>> ERRO: O estoque não bate com o esperado!");
    }

  } catch (error: any) {
    console.error("❌ ERRO NO SERVIÇO:", error.message);
  }
}

diagnose().finally(() => prisma.$disconnect());
