import { PrismaClient, SaleStatus, StockMovementType, PaymentMethod, GoalType, User, Product, Customer } from "@prisma/client";
import { subDays, addHours, isWeekend, startOfDay } from "date-fns";
import { fakerPT_BR as faker } from "@faker-js/faker";

export async function seedOrders(
  prisma: PrismaClient,
  companyId: string,
  users: Record<string, User>,
  products: Record<string, Product>,
  customers: Customer[]
) {
  console.log("📊 Generating atemporal 60-day demo history (SP Timezone)...");

  const now = new Date();
  
  const sellableProducts = Object.values(products);
  const sellerAdmin = users["Everton"];
  const sellerMember = users["Atendente"];

  // 0. Cleanup existing orders/sales for this company to ensure idempotency
  console.log("🧹 Cleaning up existing operational data...");
  await prisma.stockMovement.deleteMany({ where: { companyId } });
  await prisma.stockEntry.deleteMany({ where: { companyId } });
  await prisma.saleItem.deleteMany({ where: { sale: { companyId } } });
  await prisma.sale.deleteMany({ where: { companyId } });
  await prisma.orderItem.deleteMany({ where: { order: { companyId } } });
  await prisma.order.deleteMany({ where: { companyId } });
  await prisma.productionOrder.deleteMany({ where: { companyId } });
  await prisma.goal.deleteMany({ where: { companyId } });
  await prisma.notification.deleteMany({ where: { companyId } });
  await prisma.fixedExpense.deleteMany({ where: { companyId } });

  for (let i = 15; i >= 0; i--) {
    const currentDate = subDays(now, i);
    const isWknd = isWeekend(currentDate);

    // 1. Production Orders (Batch)
    const batchProduct = products["Hambúrguer Caseiro"] || products["Croissant de Frango"];
    if (batchProduct) {
        const productionQty = isWknd ? faker.number.int({ min: 30, max: 50 }) : faker.number.int({ min: 10, max: 20 });
        await prisma.productionOrder.create({
          data: {
            productId: batchProduct.id,
            companyId,
            quantity: productionQty,
            totalCost: Number(batchProduct.cost) * productionQty,
            createdById: sellerAdmin.id,
            createdAt: addHours(startOfDay(currentDate), 8),
          },
        });
    }

    // 2. Daily Sales
    const dailySalesCount = isWknd ? faker.number.int({ min: 15, max: 25 }) : faker.number.int({ min: 5, max: 12 });

    for (let s = 0; s < dailySalesCount; s++) {
      const saleDate = addHours(startOfDay(currentDate), faker.number.int({ min: 10, max: 22 }));
      const seller = s % 3 === 0 ? sellerMember : sellerAdmin;

      const sale = await prisma.sale.create({
        data: {
          date: saleDate,
          companyId,
          userId: seller.id,
          customerId: s % 2 === 0 ? (faker.helpers.arrayElement(customers) as Customer).id : null,
          status: SaleStatus.ACTIVE,
          paymentMethod: faker.helpers.arrayElement([
            PaymentMethod.CASH, 
            PaymentMethod.PIX, 
            PaymentMethod.CREDIT_CARD, 
            PaymentMethod.DEBIT_CARD
          ]),
          totalAmount: 0,
          totalCost: 0,
        },
      });

      const itemCount = faker.number.int({ min: 1, max: 4 });
      let totalAmount = 0;
      let totalCost = 0;

      for (let it = 0; it < itemCount; it++) {
        const product = faker.helpers.arrayElement(sellableProducts) as Product;
        if (product.type === "INSUMO") continue; 

        const qty = faker.number.int({ min: 1, max: 2 });

        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: qty,
            unitPrice: product.price,
            baseCost: Number(product.cost),
            totalAmount: Number(product.price) * qty,
            totalCost: Number(product.cost) * qty,
          },
        });
        
        totalAmount += Number(product.price) * qty;
        totalCost += Number(product.cost) * qty;

        await prisma.stockMovement.create({
          data: {
            type: StockMovementType.SALE,
            productId: product.id,
            companyId,
            userId: seller.id,
            saleId: sale.id,
            stockBefore: 100, 
            stockAfter: 100 - qty,
            quantityDecimal: qty,
            createdAt: saleDate,
          },
        });
      }

      await prisma.sale.update({
        where: { id: sale.id },
        data: { totalAmount, totalCost },
      });
    }
  }

  // 3. Open Orders (Comandas) - For testing POS and KDS
  console.log("📝 Seeding dynamic open orders (comandas)...");
  const openOrderScenarios = [
    { customer: customers[0], hoursAgo: 0.5, items: ["Coca-Cola 350ml", "Hambúrguer Caseiro"] },
    { customer: customers[1], hoursAgo: 1.5, items: ["Gin Tônica Clássica", "Croissant de Frango"] },
    { customer: null, hoursAgo: 2, items: ["Cerveja Heineken"] },
  ];

  for (const scenario of openOrderScenarios) {
    const orderDate = new Date(now.getTime() - scenario.hoursAgo * 60 * 60 * 1000);
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        companyId,
        customerId: scenario.customer?.id || null,
        tableNumber: faker.number.int({ min: 1, max: 20 }).toString(),
        createdAt: orderDate,
        updatedAt: orderDate,
        totalAmount: 0,
      },
    });

    let orderTotal = 0;
    for (const itemName of scenario.items) {
      const product = products[itemName];
      if (!product) continue;
      const up = Number(product.price);
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1,
          unitPrice: up,
          createdAt: orderDate,
        },
      });
      orderTotal += up;
    }
    await prisma.order.update({ where: { id: order.id }, data: { totalAmount: orderTotal } });
  }

  // 4. Goals and Notifications
  await prisma.goal.createMany({
    data: [
      { 
        name: "Meta de Vendas Mensal", 
        type: GoalType.GLOBAL, 
        targetValue: 25000, 
        startDate: startOfDay(now), 
        companyId, 
        createdById: users["Matheus"].id 
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      { title: "Estoque Crítico", message: "O produto 'Cerveja Heineken' está quase esgotado.", type: "STOCK_ALERT", companyId },
      { title: "Dashboard Atualizado", message: "Seu relatório semanal está pronto.", type: "SYSTEM", companyId },
    ],
  });
}
