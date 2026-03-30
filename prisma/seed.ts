import { PrismaClient, UserRole, SaleStatus, StockMovementType, ProductType, UnitType, SubscriptionStatus, PaymentMethod, GoalType, GoalPeriod } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, startOfDay, addHours, isWeekend, addDays } from "date-fns";
import { fakerPT_BR as faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting robust and comprehensive seeding for Kipo...");

  const hashedPassword = await hash("senha123", 10);

  // =============================================
  // 1. Create Company
  // =============================================
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

  // =============================================
  // 2. Create Users
  // =============================================
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

  // =============================================
  // 3. Create Product Categories
  // =============================================
  console.log("📂 Seeding product categories...");
  const prodCategoriesData = [
    { name: "Bebidas", icon: "GlassWater" },
    { name: "Salgados", icon: "Utensils" },
    { name: "Cafeteria", icon: "Coffee" },
    { name: "Sobremesas", icon: "IceCream" },
    { name: "Insumos", icon: "Package" },
    { name: "Combos", icon: "Layers" },
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

  // =============================================
  // 4. Create INSUMOS (raw materials as Product type INSUMO)
  // =============================================
  console.log("🥬 Seeding insumos (raw materials)...");
  const insumosData = [
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
    // Insumos extras para o Combo Burger
    { name: "Pão de Hambúrguer", unit: UnitType.UN, cost: 1.2, stock: 200, minStock: 40 },
    { name: "Carne Bovina (Blend)", unit: UnitType.KG, cost: 38.0, stock: 20, minStock: 5 },
    { name: "Queijo Cheddar", unit: UnitType.KG, cost: 42.0, stock: 8, minStock: 2 },
    { name: "Alface e Tomate", unit: UnitType.KG, cost: 8.0, stock: 10, minStock: 3 },
    { name: "Batata Congelada", unit: UnitType.KG, cost: 14.0, stock: 25, minStock: 5 },
  ];

  const insumos: Record<string, any> = {};
  for (const iData of insumosData) {
    const sku = `insumo-${iData.name.toLowerCase().replace(/[/ ]/g, "-")}`;
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId: company.id } },
      update: { cost: iData.cost, unit: iData.unit, type: ProductType.INSUMO },
      create: {
        name: iData.name,
        price: 0, // Insumos não são vendidos diretamente
        cost: iData.cost,
        stock: iData.stock,
        minStock: iData.minStock,
        unit: iData.unit,
        sku,
        type: ProductType.INSUMO,
        companyId: company.id,
        categoryId: productCategories["Insumos"].id,
      },
    });
    insumos[iData.name] = product;
  }

  // =============================================
  // 5. Create Customer Categories
  // =============================================
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

  // =============================================
  // 6. Create CRM Stages
  // =============================================
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

  // =============================================
  // 7. Create Customers
  // =============================================
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
      },
    });
    customers.push(customer);
  }

  // =============================================
  // 8. Create Products: REVENDA
  // =============================================
  console.log("📦 Seeding products (REVENDA)...");
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
      update: { name: p.name, price: p.price, cost: p.cost, categoryId: productCategories[p.category].id, type: ProductType.REVENDA },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: p.minStock,
        sku,
        type: ProductType.REVENDA,
        companyId: company.id,
        categoryId: productCategories[p.category].id,
        trackExpiration: true,
        expirationDate: addDays(new Date(), p.expiration),
      },
    });
    products[p.name] = product;
  }

  // =============================================
  // 9. Create Products: PRODUCAO_PROPRIA + ProductComposition
  // =============================================
  console.log("🍳 Seeding products (PRODUCAO_PROPRIA) with compositions...");
  const preparedData = [
    {
      name: "Coxinha Especial",
      price: 10.0,
      cost: 3.5,
      stock: 40,
      minStock: 15,
      category: "Salgados",
      composition: [
        { insumo: "Farinha de Trigo", qty: 0.05 },
        { insumo: "Peito de Frango", qty: 0.03 },
        { insumo: "Requeijão", qty: 0.01 },
        { insumo: "Óleo de Fritura", qty: 0.01 },
      ],
    },
    {
      name: "Gin Tônica",
      price: 28.0,
      cost: 8.5,
      stock: 0,
      minStock: 0,
      category: "Bebidas",
      composition: [
        { insumo: "Gin", qty: 0.05 },
        { insumo: "Tônica", qty: 0.2 },
        { insumo: "Limão", qty: 0.5 },
        { insumo: "Gelo", qty: 0.2 },
      ],
    },
    {
      name: "Espresso",
      price: 6.0,
      cost: 1.2,
      stock: 0,
      minStock: 0,
      category: "Cafeteria",
      composition: [
        { insumo: "Café em Grãos", qty: 0.01 },
        { insumo: "Açúcar/Adoçante", qty: 1 },
      ],
    },
    {
      name: "Hambúrguer Rota Burger",
      price: 32.0,
      cost: 12.0,
      stock: 0,
      minStock: 0,
      category: "Salgados",
      composition: [
        { insumo: "Pão de Hambúrguer", qty: 1 },
        { insumo: "Carne Bovina (Blend)", qty: 0.18 },
        { insumo: "Queijo Cheddar", qty: 0.03 },
        { insumo: "Alface e Tomate", qty: 0.05 },
        { insumo: "Sal e Temperos", qty: 0.005 },
      ],
    },
    {
      name: "Porção de Batata Frita",
      price: 18.0,
      cost: 5.0,
      stock: 0,
      minStock: 0,
      category: "Salgados",
      composition: [
        { insumo: "Batata Congelada", qty: 0.3 },
        { insumo: "Óleo de Fritura", qty: 0.05 },
        { insumo: "Sal e Temperos", qty: 0.005 },
      ],
    },
  ];

  for (const p of preparedData) {
    const sku = p.name.toLowerCase().replace(/ /g, "-");
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId: company.id } },
      update: { name: p.name, price: p.price, cost: p.cost, categoryId: productCategories[p.category].id, type: ProductType.PRODUCAO_PROPRIA },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: p.minStock,
        type: ProductType.PRODUCAO_PROPRIA,
        sku,
        companyId: company.id,
        categoryId: productCategories[p.category].id,
      },
    });

    // Create ProductComposition entries (Ficha Técnica)
    for (const comp of p.composition) {
      const child = insumos[comp.insumo];
      if (!child) {
        console.warn(`⚠️  Insumo "${comp.insumo}" not found, skipping composition.`);
        continue;
      }
      await prisma.productComposition.upsert({
        where: { parentId_childId: { parentId: product.id, childId: child.id } },
        update: { quantity: comp.qty },
        create: {
          parentId: product.id,
          childId: child.id,
          quantity: comp.qty,
        },
      });
    }
    products[p.name] = product;
  }

  // =============================================
  // 10. Create Product: COMBO (recursive composition)
  // =============================================
  console.log("🎁 Seeding combo product...");
  const comboSku = "combo-rota-burger";
  const comboProduct = await prisma.product.upsert({
    where: { sku_companyId: { sku: comboSku, companyId: company.id } },
    update: { type: ProductType.COMBO },
    create: {
      name: "Combo Rota Burger",
      price: 45.0,
      cost: 19.5, // Hambúrguer (12) + Batata (5) + Refri (2.5)
      stock: 0,
      minStock: 0,
      sku: comboSku,
      type: ProductType.COMBO,
      companyId: company.id,
      categoryId: productCategories["Combos"].id,
    },
  });
  products["Combo Rota Burger"] = comboProduct;

  // Combo composition: Hambúrguer (PRODUCAO_PROPRIA) + Batata (PRODUCAO_PROPRIA) + Refri (REVENDA)
  const comboChildren = [
    { childName: "Hambúrguer Rota Burger", qty: 1 },
    { childName: "Porção de Batata Frita", qty: 1 },
    { childName: "Refrigerante Lata 350ml", qty: 1 },
  ];

  for (const cc of comboChildren) {
    const child = products[cc.childName];
    if (!child) {
      console.warn(`⚠️  Product "${cc.childName}" not found for combo, skipping.`);
      continue;
    }
    await prisma.productComposition.upsert({
      where: { parentId_childId: { parentId: comboProduct.id, childId: child.id } },
      update: { quantity: cc.qty },
      create: {
        parentId: comboProduct.id,
        childId: child.id,
        quantity: cc.qty,
      },
    });
  }

  // =============================================
  // 11. Generate History (Last 60 days)
  // =============================================
  console.log("📊 Generating 60-day demo history...");
  const today = new Date("2026-03-16T12:00:00Z");

  // Only sell products that have a price > 0 (exclude INSUMO)
  const sellableProducts = Object.values(products);

  for (let i = 60; i >= 0; i--) {
    const currentDate = subDays(today, i);
    const isWknd = isWeekend(currentDate);

    // 11.1 Production Orders
    const coxinhaProduction = isWknd ? faker.number.int({ min: 80, max: 120 }) : faker.number.int({ min: 40, max: 60 });
    await prisma.productionOrder.create({
      data: {
        productId: products["Coxinha Especial"].id,
        companyId: company.id,
        quantity: coxinhaProduction,
        totalCost: Number(products["Coxinha Especial"].cost) * coxinhaProduction,
        createdById: users["Everton"].id,
        createdAt: addHours(currentDate, 8),
      },
    });

    // 11.2 Sales
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

      for (let it = 0; it < itemCount; it++) {
        const product = sellableProducts[faker.number.int({ min: 0, max: sellableProducts.length - 1 })];
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
            companyId: company.id,
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

  // =============================================
  // 12. Manual Adjustments
  // =============================================
  console.log("🔧 Adding adjustments and audit trails...");
  const adjustmentReasons = [
    { reason: "Consumo Interno - Staff", item: null as string | null },
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
      },
    });
  }

  // =============================================
  // 13. Goals, Checklists, Notifications
  // =============================================
  console.log("🎯 Seeding goals, checklists, and notifications...");
  await prisma.goal.createMany({
    data: [
      { name: "Meta de Vendas Mensal", type: GoalType.GLOBAL, targetValue: 15000, startDate: startOfDay(today), companyId: company.id, createdById: users["Matheus"].id },
      { name: "Meta Coxinhas", type: GoalType.PRODUCT, productId: products["Coxinha Especial"].id, targetValue: 500, startDate: startOfDay(today), companyId: company.id, createdById: users["Matheus"].id },
    ],
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
        ],
      },
    },
  });

  await prisma.notification.createMany({
    data: [
      { title: "Estoque Baixo", message: "O produto 'Cerveja Long Neck' está abaixo do mínimo.", type: "STOCK_ALERT", companyId: company.id },
      { title: "Produtos Vencendo", message: "Itens vencendo nos próximos 7 dias.", type: "EXPIRATION_ALERT", companyId: company.id },
    ],
  });

  // =============================================
  // 14. Open Orders (Comandas)
  // =============================================
  console.log("📝 Seeding dynamic open orders (comandas)...");
  const actualNow = new Date();

  const openOrderScenarios = [
    { customer: customers[1], hoursAgo: 1, items: ["Cerveja Long Neck 330ml", "Coxinha Especial"] },
    { customer: customers[2], hoursAgo: 2, items: ["Gin Tônica", "Coxinha Especial", "Coxinha Especial"] },
    { customer: customers[3], hoursAgo: 3, items: ["Espresso", "Espresso"] },
    { customer: customers[4], hoursAgo: 5, items: ["Combo Rota Burger"] },
    { customer: customers[5], hoursAgo: 4, items: ["Gin Tônica", "Porção de Batata Frita"] },
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
      },
    });

    let totalAmount = 0;
    for (const itemName of scenario.items) {
      const product = products[itemName];
      if (!product) {
        console.warn(`⚠️  Product "${itemName}" not found for order, skipping.`);
        continue;
      }
      const qty = 1;
      const unitPrice = Number(product.price);

      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: qty,
          unitPrice: unitPrice,
          createdAt: orderDate,
        },
      });
      totalAmount += unitPrice * qty;
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { totalAmount },
    });
  }

  console.log("✅ Seed finished successfully! Product hierarchy:");
  console.log("   📦 INSUMO: Farinha, Carne, Queijo, Batata, etc.");
  console.log("   🍳 PRODUCAO_PROPRIA: Coxinha, Gin Tônica, Hambúrguer, Batata Frita");
  console.log("   🏪 REVENDA: Cerveja, Água, Refrigerante");
  console.log("   🎁 COMBO: Combo Rota Burger (Hambúrguer + Batata + Refri)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
