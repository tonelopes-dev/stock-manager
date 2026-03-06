import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando normalização de clientes...");

  const customers = await prisma.customer.findMany({
    include: {
      orders: true,
      categories: true,
    },
  });

  console.log(`📊 Encontrados ${customers.length} clientes.`);

  const companyGroups: Record<string, Record<string, typeof customers>> = {};

  // Agrupar por empresa e telefone normalizado
  for (const customer of customers) {
    if (!customer.phoneNumber) continue;

    const normalized = customer.phoneNumber.replace(/\D/g, "");
    
    if (!companyGroups[customer.companyId]) {
      companyGroups[customer.companyId] = {};
    }

    if (!companyGroups[customer.companyId][normalized]) {
      companyGroups[customer.companyId][normalized] = [];
    }

    companyGroups[customer.companyId][normalized].push(customer);
  }

  for (const companyId in companyGroups) {
    for (const phone in companyGroups[companyId]) {
      const group = companyGroups[companyId][phone];

      // Atualizar todos para o telefone normalizado
      for (const c of group) {
        if (c.phoneNumber !== phone) {
          await prisma.customer.update({
            where: { id: c.id },
            data: { phoneNumber: phone },
          });
          console.log(`✅ Telefone de ${c.name} (${c.id}) normalizado para ${phone}`);
        }
      }

      // Se houver mais de um, mesclar
      if (group.length > 1) {
        console.log(`⚠️  Encontrados ${group.length} duplicados para o telefone ${phone} na empresa ${companyId}. Mesclando...`);
        
        // Ordenar por data de criação (ou ID, ou atividade) - vamos manter o mais recente
        const sorted = group.sort((a, b) => b.id.localeCompare(a.id)); 
        const master = sorted[0];
        const duplicates = sorted.slice(1);

        for (const duplicate of duplicates) {
          console.log(`   - Mesclando ${duplicate.name} (${duplicate.id}) em ${master.name} (${master.id})`);
          
          // Reatribuir pedidos
          await prisma.order.updateMany({
            where: { customerId: duplicate.id },
            data: { customerId: master.id },
          });

          // Reatribuir categorias (muitos-para-muitos precisa de cuidado)
          // Como é uma relação implícita no Prisma, precisamos conectar no mestre e desconectar no duplicado
          // Mas para simplificar neste script, vamos apenas deletar o duplicado (as categorias dele podem ser perdidas ou reconectadas manualmente se necessário)
          // Mas vamos tentar reconectar:
          if (duplicate.categories.length > 0) {
              await prisma.customer.update({
                  where: { id: master.id },
                  data: {
                      categories: {
                          connect: duplicate.categories.map(cat => ({ id: cat.id }))
                      }
                  }
              });
          }

          // Deletar o duplicado
          await prisma.customer.delete({
            where: { id: duplicate.id },
          });
          console.log(`   🗑️  Duplicado ${duplicate.id} removido.`);
        }
      }
    }
  }

  console.log("✨ Normalização concluída!");
}

main()
  .catch((e) => {
    console.error("❌ Erro na normalização:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
