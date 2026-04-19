import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Inciando limpeza profunda de duplicatas...");

  // 1. Buscar TODOS os nomes duplicados por empresa (independente de tipo)
  const duplicates: any[] = await prisma.$queryRaw`
    SELECT name, "companyId", COUNT(*)
    FROM "Product"
    GROUP BY name, "companyId"
    HAVING COUNT(*) > 1
  `;

  if (duplicates.length === 0) {
    console.log("✅ Nenhuma duplicata encontrada.");
    return;
  }

  console.log(`Found ${duplicates.length} groups of duplicates.`);

  for (const group of duplicates) {
    const records = await prisma.product.findMany({
      where: {
        name: group.name,
        companyId: group.companyId,
      },
      orderBy: [
        { isActive: "desc" },
        { updatedAt: "desc" },
      ],
    });

    const [keeper, ...toRename] = records;

    console.log(`Keeping: ${keeper.name} (${keeper.id}) - Active: ${keeper.isActive}`);

    for (const record of toRename) {
      const shortId = record.id.slice(0, 8);
      const newName = `${record.name} (Arquivado - ${shortId})`;
      
      console.log(`Renaming: ${record.name} -> ${newName} (${record.id})`);
      
      await prisma.product.update({
        where: { id: record.id },
        data: { name: newName },
      });
    }
  }

  console.log("🚀 Limpeza concluída!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
