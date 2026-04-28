import { PrismaClient } from "@prisma/client";

async function checkNeon(url: string, label: string) {
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  console.log(`--- CHECANDO ${label} ---`);
  try {
    const productCount = await prisma.product.count();
    console.log(`Conectado! Produtos encontrados: ${productCount}`);
  } catch (error) {
    console.log(`Falha ao conectar em ${label}`);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  // URLs do seu .env
  const prodUrl = "postgresql://stocklydb_owner:npg_zH7DMTgGQmB1@ep-super-base-ac3aj2i8-pooler.sa-east-1.aws.neon.tech/stocklydb?sslmode=require&channel_binding=require";
  const devUrl = "postgresql://stocklydb_owner:npg_zH7DMTgGQmB1@ep-wispy-grass-ac43bwth-pooler.sa-east-1.aws.neon.tech/stocklydb?sslmode=require&channel_binding=require";
  
  await checkNeon(prodUrl, "NEON PROD");
  await checkNeon(devUrl, "NEON DEV");
}

main();
