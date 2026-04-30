import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando migração de clientes 'fantasmas' do Cardápio Digital...");

  // 1. Buscar todos os clientes com source "MENU" que não possuem stageId
  const phantomCustomers = await prisma.customer.findMany({
    where: {
      source: "MENU",
      stageId: null,
    },
    select: {
      id: true,
      companyId: true,
    },
  });

  console.log(`🔍 Encontrados ${phantomCustomers.length} clientes sem etapa no CRM.`);

  if (phantomCustomers.length === 0) {
    console.log("✅ Nenhum cliente fantasma encontrado. Tudo atualizado!");
    return;
  }

  // Agrupar por empresa para otimizar as transações
  const customersByCompany = phantomCustomers.reduce((acc, customer) => {
    if (!acc[customer.companyId]) {
      acc[customer.companyId] = [];
    }
    acc[customer.companyId].push(customer.id);
    return acc;
  }, {} as Record<string, string[]>);

  for (const companyId in customersByCompany) {
    console.log(`📦 Processando empresa: ${companyId}...`);

    // 1. Garantir Etapa e Categoria (em uma transação rápida)
    const { category, stage } = await prisma.$transaction(async (tx) => {
      const cat = await tx.customerCategory.upsert({
        where: { name_companyId: { name: "Cardápio Digital", companyId } },
        update: {},
        create: { name: "Cardápio Digital", companyId },
      });

      let stg = await tx.cRMStage.findUnique({
        where: { name_companyId: { name: "Cardápio Digital", companyId } },
      });

      if (!stg) {
        await tx.cRMStage.updateMany({
          where: { companyId },
          data: { order: { increment: 1 } },
        });

        stg = await tx.cRMStage.create({
          data: {
            name: "Cardápio Digital",
            order: 0,
            companyId,
          },
        });
      }

      return { category: cat, stage: stg };
    });

    // 2. Atualizar Clientes (fora da transação para evitar timeout)
    const customerIds = customersByCompany[companyId];
    
    const currentMaxPosition = await prisma.customer.aggregate({
      where: { stageId: stage.id },
      _max: { position: true },
    });

    let startPosition = (currentMaxPosition._max.position ?? -1) + 1;

    console.log(`⏳ Atualizando ${customerIds.length} clientes...`);
    
    for (const customerId of customerIds) {
      await prisma.customer.update({
        where: { id: customerId },
        data: {
          stageId: stage.id,
          position: startPosition++,
          categories: {
            connect: { id: category.id },
          },
        },
      });
    }
    
    console.log(`✅ Migrados ${customerIds.length} clientes para a empresa ${companyId}.`);
  }

  console.log("🏁 Migração finalizada com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante a migração:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
