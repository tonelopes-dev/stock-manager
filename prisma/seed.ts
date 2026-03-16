import { PrismaClient, UserRole, SaleStatus, StockMovementType, ProductType, UnitType, AuditSeverity, AuditEventType, SubscriptionStatus, PaymentMethod, GoalType, GoalPeriod } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, startOfDay, addHours, isWeekend, addDays } from "date-fns";
import { fakerPT_BR as faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting robust and comprehensive seeding for Stocky...");

  const hashedPassword = await hash("senha123", 10);

  // 1. Create Company
  console.log("🏢 Seeding company...");
  const company = await prisma.company.upsert({
    where: { id: "rota-360-id" },
    update: {
      name: "Rota 360",
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 90)),
    },
    create: {
      id: "rota-360-id",
      name: "Rota 360",
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(new Date().setDate(new Date().getDate() + 90)),
    },
  });

  // 2. Create Users
  console.log("👥 Seeding users...");
  const userData = [
    { name: "Matheus", email: "matheus@rota360.com", role: UserRole.OWNER },
    { name: "Everton", email: "everton@rota360.com", role: UserRole.ADMIN },
    { name: "Atendente", email: "atendente@rota360.com", role: UserRole.MEMBER },
  ];

  const users: Record<string, any> = {};
  for (const u of userData) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name },
      create: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
      },
    });

    await prisma.userCompany.upsert({
      where: { userId_companyId: { userId: user.id, companyId: company.id } },
      update: { role: u.role },
      create: {
        userId: user.id,
        companyId: company.id,
        role: u.role,
      },
    });
    users[u.name] = user;
  }

  // 3. Create Product Categories
  console.log("📂 Seeding product categories...");
  const prodCategoriesData = [
    { name: "Bebidas", icon: "GlassWater" },
    { name: "Salgados", icon: "Utensils" },
    { name: "Cafeteria", icon: "Coffee" },
    { name: "Sobremesas", icon: "IceCream" },
  ];
  
  const productCategories: Record<string, any> = {};
  for (const cat of prodCategoriesData) {
    const category = await prisma.category.upsert({
      where: { name_companyId: { name: cat.name, companyId: company.id } },
      update: { icon: cat.icon },
      create: { name: cat.name, icon: cat.icon, companyId: company.id },
    });
    productCategories[cat.name] = category;
  }

  // 4. Create Ingredients
  console.log("🥬 Seeding ingredients...");
  const ingredientsData = [
    { name: "Farinha de Trigo", unit: UnitType.KG, cost: 4.5, stock: 50, minStock: 10 },
    { name: "Peito de Frango", unit: UnitType.KG, cost: 22.0, stock: 15, minStock: 8 },
    { name: "Requeijão", unit: UnitType.KG, cost: 35.0, stock: 10, minStock: 3 },
    { name: "Óleo de Fritura", unit: UnitType.L, cost: 7.5, stock: 20, minStock: 5 },
    { name: "Farinha de Rosca", unit: UnitType.KG, cost: 6.0, stock: 15, minStock: 4 },
    { name: "Ovos", unit: UnitType.UN, cost: 0.8, stock: 120, minStock: 30 },
    { name: "Sal e Temperos", unit: UnitType.KG, cost: 12.0, stock: 5, minStock: 1 },
    { name: "Gin", unit: UnitType.UN, cost: 85.0, stock: 12, minStock: 3 },
    { name: "Tônica", unit: UnitType.L, cost: 12.0, stock: 24, minStock: 6 },
    { name: "Água com Gás", unit: UnitType.UN, cost: 2.5, stock: 48, minStock: 12 },
    { name: "Limão", unit: UnitType.UN, cost: 0.5, stock: 100, minStock: 20 },
    { name: "Gelo", unit: UnitType.KG, cost: 2.0, stock: 50, minStock: 10 },
    { name: "Café em Grãos", unit: UnitType.KG, cost: 45.0, stock: 10, minStock: 2 },
    { name: "Leite Integral", unit: UnitType.L, cost: 5.5, stock: 30, minStock: 6 },
    { name: "Açúcar/Adoçante", unit: UnitType.UN, cost: 0.1, stock: 500, minStock: 100 },
  ];

  const ingredients: Record<string, any> = {};
  for (const iData of ingredientsData) {
    let ingredient = await prisma.ingredient.findFirst({
      where: { name: iData.name, companyId: company.id }
    });

    if (ingredient) {
      ingredient = await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: { cost: iData.cost, unit: iData.unit }
      });
    } else {
      ingredient = await prisma.ingredient.create({
        data: { ...iData, companyId: company.id }
      });
    }
    ingredients[iData.name] = ingredient;
  }

  // 5. Create Customer Categories
  console.log("🏷️ Seeding customer categories...");
  const custCategoriesNames = ["Coworking", "Restaurante", "Bistrô", "Evento", "Outros"];
  const custCategories: Record<string, any> = {};
  for (const name of custCategoriesNames) {
    const category = await prisma.customerCategory.upsert({
      where: { name_companyId: { name, companyId: company.id } },
      update: {},
      create: { name, companyId: company.id },
    });
    custCategories[name] = category;
  }

  // 6. Create CRM Stages
  console.log("📊 Seeding CRM stages...");
  const stagesData = [
    { name: "Prospecção", order: 0 },
    { name: "Contato Feito", order: 1 },
    { name: "Proposta Enviada", order: 2 },
    { name: "Convertido", order: 3 },
  ];
  const stages: Record<string, any> = {};
  for (const s of stagesData) {
    const stage = await prisma.cRMStage.upsert({
      where: { name_companyId: { name: s.name, companyId: company.id } },
      update: { order: s.order },
      create: { ...s, companyId: company.id },
    });
    stages[s.name] = stage;
  }

  // 7. Create Customers
  console.log("👤 Seeding customers...");
  const customers: any[] = [];
  for (let i = 0; i < 20; i++) {
    const categoryName = faker.helpers.arrayElement(custCategoriesNames);
    const stageName = faker.helpers.arrayElement(stagesData).name;
    const customer = await prisma.customer.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        categories: {
          connect: { id: custCategories[categoryName].id },
        },
        stageId: stages[stageName].id,
        companyId: company.id,
        notes: faker.lorem.sentence(),
      }
    });
    customers.push(customer);
  }

  // 8. Create Products (Resell and Prepared)
  console.log("📦 Seeding products...");
  const resellData = [
    { name: "Cerveja Long Neck 330ml", price: 12.0, cost: 5.5, stock: 120, minStock: 24, category: "Bebidas", expiration: 30 },
    { name: "Água sem Gás 500ml", price: 5.0, cost: 1.5, stock: 100, minStock: 20, category: "Bebidas", expiration: 180 },
    { name: "Refrigerante Lata 350ml", price: 7.0, cost: 2.5, stock: 80, minStock: 20, category: "Bebidas", expiration: 90 },
  ];

  const products: Record<string, any> = {};
  for (const p of resellData) {
    const sku = p.name.toLowerCase().replace(/ /g, "-");
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId: company.id } },
      update: { name: p.name, price: p.price, cost: p.cost, categoryId: productCategories[p.category].id },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: p.minStock,
        sku,
        type: ProductType.RESELL,
        companyId: company.id,
        categoryId: productCategories[p.category].id,
        trackExpiration: true,
        expirationDate: addDays(new Date(), p.expiration),
      },
    });
    products[p.name] = product;
  }

  const preparedData = [
    {
      name: "Coxinha Especial",
      price: 10.0,
      cost: 3.5,
      stock: 40,
      minStock: 15,
      category: "Salgados",
      recipe: [
        { name: "Farinha de Trigo", qty: 0.05 },
        { name: "Peito de Frango", qty: 0.03 },
        { name: "Requeijão", qty: 0.01 },
        { name: "Óleo de Fritura", qty: 0.01 },
      ]
    },
    {
      name: "Gin Tônica",
      price: 28.0,
      cost: 8.5,
      stock: 0,
      minStock: 0,
      category: "Bebidas",
      recipe: [
        { name: "Gin", qty: 0.05 },
        { name: "Tônica", qty: 0.2 },
        { name: "Limão", qty: 0.5 },
        { name: "Gelo", qty: 0.2 },
      ]
    },
    {
      name: "Espresso",
      price: 6.0,
      cost: 1.2,
      stock: 0,
      minStock: 0,
      category: "Cafeteria",
      recipe: [
        { name: "Café em Grãos", qty: 0.01 },
        { name: "Açúcar/Adoçante", qty: 1 },
      ]
    }
  ];

  for (const p of preparedData) {
    const sku = p.name.toLowerCase().replace(/ /g, "-");
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId: company.id } },
      update: { name: p.name, price: p.price, cost: p.cost, categoryId: productCategories[p.category].id },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: p.minStock,
        type: ProductType.PREPARED,
        sku,
        companyId: company.id,
        categoryId: productCategories[p.category].id,
      },
    });
    
    for (const r of p.recipe) {
      await prisma.productRecipe.upsert({
        where: { productId_ingredientId: { productId: product.id, ingredientId: ingredients[r.name].id } },
        update: { quantity: r.qty },
        create: {
          productId: product.id,
          ingredientId: ingredients[r.name].id,
          quantity: r.qty,
          unit: ingredients[r.name].unit,
        }
      });
    }
    products[p.name] = product;
  }

  // 9. Generate History (Last 60 days)
  console.log("📊 Generating 60-day demo history...");
  const today = new Date("2026-03-16T12:00:00Z");

  for (let i = 60; i >= 0; i--) {
    const currentDate = subDays(today, i);
    const isWknd = isWeekend(currentDate);
    
    // 9.1 Production Orders
    const coxinhaProduction = isWknd ? faker.number.int({ min: 80, max: 120 }) : faker.number.int({ min: 40, max: 60 });
    await prisma.productionOrder.create({
      data: {
        productId: products["Coxinha Especial"].id,
        companyId: company.id,
        quantity: coxinhaProduction,
        totalCost: Number(products["Coxinha Especial"].cost) * coxinhaProduction,
        createdById: users["Everton"].id,
        createdAt: addHours(currentDate, 8),
      }
    });

    // 9.2 Sales
    const dailySalesCount = isWknd ? faker.number.int({ min: 15, max: 25 }) : faker.number.int({ min: 5, max: 12 });
    
    for (let s = 0; s < dailySalesCount; s++) {
      const saleDate = addHours(currentDate, faker.number.int({ min: 10, max: 22 }));
      const seller = s % 3 === 0 ? users["Atendente"] : users["Everton"];
      
      const sale = await prisma.sale.create({
        data: {
          date: saleDate,
          companyId: company.id,
          userId: seller.id,
          customerId: s % 2 === 0 ? faker.helpers.arrayElement(customers).id : null,
          status: SaleStatus.ACTIVE,
          paymentMethod: faker.helpers.arrayElement([PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD]),
          totalAmount: 0,
          totalCost: 0,
        },
      });

      const itemCount = faker.number.int({ min: 1, max: 3 });
      let totalAmount = 0;
      let totalCost = 0;

      const pList = Object.values(products);
      for (let it = 0; it < itemCount; it++) {
        const product = pList[faker.number.int({ min: 0, max: pList.length - 1 })];
        const qty = faker.number.int({ min: 1, max: 2 });
        
        await prisma.saleItem.create({
          data: {
            saleId: sale.id,
            productId: product.id,
            quantity: qty,
            unitPrice: product.price,
            baseCost: product.cost,
            totalAmount: Number(product.price) * qty,
            totalCost: Number(product.cost) * qty,
          }
        });
        totalAmount += Number(product.price) * qty;
        totalCost += Number(product.cost) * qty;

        await prisma.stockMovement.create({
          data: {
            type: StockMovementType.SALE,
            productId: product.id,
            companyId: company.id,
            userId: seller.id,
            saleId: sale.id,
            stockBefore: 100, 
            stockAfter: 100 - qty,
            quantityDecimal: qty,
            createdAt: saleDate,
          }
        });
      }

      await prisma.sale.update({
        where: { id: sale.id },
        data: { totalAmount, totalCost }
      });
    }
  }

  // 10. Manual Adjustments & Audit Events
  console.log("🔧 Adding adjustments and audit trails...");
  const adjustmentReasons = [
    { reason: "Consumo Interno - Staff", item: null },
    { reason: "Perda/Quebra - Long Neck", item: "Cerveja Long Neck 330ml" },
  ];

  for (let a = 0; a < 10; a++) {
    const adj = faker.helpers.arrayElement(adjustmentReasons);
    await prisma.stockMovement.create({
      data: {
        type: StockMovementType.ADJUSTMENT,
        companyId: company.id,
        userId: users["Everton"].id,
        reason: adj.reason,
        productId: adj.item ? products[adj.item].id : null,
        stockBefore: 50,
        stockAfter: 48,
        quantityDecimal: 2,
        createdAt: subDays(today, faker.number.int({ min: 1, max: 30 })),
      }
    });
  }

  // 11. Seeding Goals & Checklists & Notifications
  console.log("🎯 Seeding goals, checklists, and notifications...");
  await prisma.goal.createMany({
    data: [
      { name: "Meta de Vendas Mensal", type: GoalType.GLOBAL, targetValue: 15000, startDate: startOfDay(today), companyId: company.id, createdById: users["Matheus"].id },
      { name: "Meta Coxinhas", type: GoalType.PRODUCT, productId: products["Coxinha Especial"].id, targetValue: 500, startDate: startOfDay(today), companyId: company.id, createdById: users["Matheus"].id }
    ]
  });

  await prisma.checklist.create({
    data: {
      title: "Checklist de Abertura",
      customerId: customers[0].id,
      companyId: company.id,
      items: {
        create: [
          { title: "Limpar mesas", order: 0, companyId: company.id },
          { title: "Ligar máquinas de café", order: 1, companyId: company.id },
        ]
      }
    }
  });

  await prisma.notification.createMany({
    data: [
      { title: "Estoque Baixo", message: "O produto 'Cerveja Long Neck' está abaixo do mínimo.", type: "STOCK_ALERT", companyId: company.id },
      { title: "Produtos Vencendo", message: "Itens vencendo nos próximos 7 dias.", type: "EXPIRATION_ALERT", companyId: company.id }
    ]
  });

  // 12. Create Open Orders (Comandas)
  console.log("📝 Seeding dynamic open orders (comandas)...");
  const actualNow = new Date(); // Using the runtime context's "now"
  
  const openOrderScenarios = [
    { customer: customers[1], hoursAgo: 1, items: ["Cerveja Long Neck 330ml", "Coxinha Especial"] },
    { customer: customers[2], hoursAgo: 2, items: ["Gin Tônica", "Coxinha Especial", "Coxinha Especial"] },
    { customer: customers[3], hoursAgo: 3, items: ["Espresso", "Espresso"] },
    { customer: customers[4], hoursAgo: 5, items: ["Refrigerante Lata 350ml", "Coxinha Especial"] },
    { customer: customers[5], hoursAgo: 4, items: ["Gin Tônica"] },
  ];

  for (const scenario of openOrderScenarios) {
    const orderDate = new Date(actualNow.getTime() - scenario.hoursAgo * 60 * 60 * 1000);
    
    const order = await prisma.order.create({
      data: {
        status: "PENDING",
        companyId: company.id,
        customerId: scenario.customer.id,
        tableNumber: faker.number.int({ min: 1, max: 20 }).toString(),
        createdAt: orderDate,
        updatedAt: orderDate,
        totalAmount: 0,
      }
    });

    let totalAmount = 0;
    for (const itemName of scenario.items) {
      const product = products[itemName];
      const qty = 1;
      const unitPrice = Number(product.price);
      
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: qty,
          unitPrice: unitPrice,
          createdAt: orderDate,
        }
      });
      totalAmount += unitPrice * qty;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount }
    });
  }

  console.log("✅ Robust and dynamic seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
