import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

async function main() {
  console.log("URL de Conexão:", process.env.DATABASE_URL);
  try {
    const productCount = await prisma.product.count();
    const companyCount = await prisma.company.count();
    const userCount = await prisma.user.count();
    
    console.log("--- CONTAGEM DE DADOS ---");
    console.log(`Empresas: ${companyCount}`);
    console.log(`Usuários: ${userCount}`);
    console.log(`Produtos: ${productCount}`);
  } catch (error) {
    console.error("Erro ao conectar ao banco:", error);
  }
}

main().finally(() => prisma.$disconnect());
