const { PrismaClient, SaleStatus, OrderStatus, PaymentMethod } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Script para gerar dados de teste diários (Comandas e Vendas).
 * Uso: node scripts/seed-daily-test-data.js [email]
 */

async function main() {
  const userEmail = process.argv[2] || 'matheus@rota360.com';
  
  console.log(`\n🚀 Iniciando carga de dados para: ${userEmail}`);
  
  // 1. Buscar Usuário e Empresa
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
    include: { userCompanies: { take: 1 } }
  });

  if (!user || user.userCompanies.length === 0) {
    console.error(`❌ Erro: Usuário ${userEmail} ou empresa não encontrada.`);
    return;
  }

  const companyId = user.userCompanies[0].companyId;
  const userId = user.id;

  // 2. Buscar Produtos e Clientes
  const products = await prisma.product.findMany({
    where: { companyId, isActive: true }
  });

  if (products.length === 0) {
    console.error("❌ Erro: Nenhum produto ativo encontrado.");
    return;
  }

  let customers = await prisma.customer.findMany({
    where: { companyId, isActive: true }
  });

  // Garantir base mínima de clientes para o teste
  if (customers.length < 50) {
      console.log(`👥 Gerando clientes adicionais...`);
      for(let i = 0; i < 50 - customers.length; i++) {
          const newCustomer = await prisma.customer.create({
              data: {
                  name: `Cliente Teste ${i + 1}`,
                  phone: `119${Math.floor(10000000 + Math.random() * 90000000)}`,
                  companyId
              }
          });
          customers.push(newCustomer);
      }
  }

  console.log(`📝 Gerando 50 comandas abertas...`);
  for (let i = 0; i < 50; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const numItems = Math.floor(Math.random() * 3) + 1;
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
    }

    const totalAmount = selectedProducts.reduce((acc, p) => acc + Number(p.price), 0);

    await prisma.order.create({
      data: {
        companyId,
        customerId: customer.id,
        status: OrderStatus.PENDING,
        tableNumber: (Math.floor(Math.random() * 30) + 1).toString(),
        notes: "Teste operacional automático",
        totalAmount,
        createdAt: new Date(), // Pega a data atual
        orderItems: {
          create: selectedProducts.map(p => ({
            productId: p.id,
            quantity: 1,
            unitPrice: p.price,
          }))
        }
      }
    });
  }

  console.log(`💰 Gerando 30 vendas finalizadas...`);
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD];
  
  for (let i = 0; i < 30; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const numItems = Math.floor(Math.random() * 4) + 1;
    const selectedProducts = [];
    
    for (let j = 0; j < numItems; j++) {
      selectedProducts.push(products[Math.floor(Math.random() * products.length)]);
    }

    const totalAmount = selectedProducts.reduce((acc, p) => acc + Number(p.price), 0);
    const totalCost = selectedProducts.reduce((acc, p) => acc + Number(p.cost) + Number(p.operationalCost), 0);
    const tipAmount = Math.random() > 0.4 ? totalAmount * 0.1 : 0;

    await prisma.sale.create({
      data: {
        companyId,
        customerId: customer.id,
        userId,
        date: new Date(), // Data do dia da execução
        status: SaleStatus.ACTIVE,
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
        totalAmount: totalAmount + tipAmount,
        totalCost,
        tipAmount,
        saleItems: {
          create: selectedProducts.map(p => ({
            productId: p.id,
            quantity: 1,
            unitPrice: p.price,
            baseCost: p.cost,
            operationalCost: p.operationalCost,
            totalAmount: p.price,
            totalCost: Number(p.cost) + Number(p.operationalCost)
          }))
        }
      }
    });
  }

  console.log("\n✅ Carga finalizada com sucesso! 🚀");
  console.log("------------------------------------");
  console.log(`Empresa: ${companyId}`);
  console.log(`Comandas Abertas: 50`);
  console.log(`Vendas Concluídas: 30`);
  console.log("------------------------------------\n");
}

main()
  .catch(e => {
    console.error("❌ Erro fatal no script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
