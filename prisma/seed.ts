import { PrismaClient, UserRole, SaleStatus, StockMovementType, ProductType, UnitType, AuditSeverity, AuditEventType, SubscriptionStatus } from "@prisma/client";
import { hash } from "bcryptjs";
import { subDays, startOfDay, addHours, isWeekend } from "date-fns";
import { fakerPT_BR as faker } from "@faker-js/faker";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting safe and dynamic seeding for Stockly...");

  const hashedPassword = await hash("senha123", 10);

  // 1. Create Company
  console.log("🏢 Seeding company...");
  const company = await prisma.company.upsert({
    where: { id: "rota-360-id" },
    update: {
      name: "Rota 360",
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
    },
    create: {
      id: "rota-360-id",
      name: "Rota 360",
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
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

  // 3. Create Ingredients
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

  // 4. Create Products
  console.log("📦 Seeding products...");
  
  const resellData = [
    { name: "Cerveja Long Neck 330ml", price: 12.0, cost: 5.5, category: "Bebidas", stock: 120, minStock: 24 },
    { name: "Água sem Gás 500ml", price: 5.0, cost: 1.5, category: "Bebidas", stock: 100, minStock: 20 },
    { name: "Refrigerante Lata 350ml", price: 7.0, cost: 2.5, category: "Bebidas", stock: 80, minStock: 20 },
  ];

  const products: Record<string, any> = {};
  for (const p of resellData) {
    const sku = p.name.toLowerCase().replace(/ /g, "-");
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId: company.id } },
      update: { name: p.name, price: p.price, cost: p.cost, category: p.category },
      create: {
        ...p,
        sku,
        type: ProductType.RESELL,
        companyId: company.id,
      },
    });
    products[p.name] = product;
  }

  const preparedData = [
    {
      name: "Coxinha Especial",
      price: 10.0,
      cost: 3.5,
      category: "Salgados",
      stock: 40,
      minStock: 15,
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
      category: "Drinks",
      stock: 0,
      minStock: 0,
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
      category: "Cafeteria",
      stock: 0,
      minStock: 0,
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
      update: { name: p.name, price: p.price, cost: p.cost, category: p.category },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        category: p.category,
        stock: p.stock,
        minStock: p.minStock,
        type: ProductType.PREPARED,
        sku,
        companyId: company.id,
      },
    });
    
    for (const r of p.recipe) {
      await prisma.productRecipe.upsert({
        where: {
          productId_ingredientId: {
            productId: product.id,
            ingredientId: ingredients[r.name].id
          }
        },
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

  // 5. Generate History (Last 90 days)
  // Check if we already have history to avoid massive duplication in production
  const saleCount = await prisma.sale.count({ where: { companyId: company.id } });
  
  if (saleCount === 0) {
    console.log("📊 Generating 90-day demo history...");
    const today = startOfDay(new Date()); // Use real today for better demo

    for (let i = 90; i >= 0; i--) {
      const currentDate = subDays(today, i);
      const isWknd = isWeekend(currentDate);
      
      // 5.1 Production Orders
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

      // 5.2 Sales
      const dailySalesCount = isWknd ? faker.number.int({ min: 15, max: 25 }) : faker.number.int({ min: 5, max: 12 });
      
      for (let s = 0; s < dailySalesCount; s++) {
        // For today (i=0), limit sales until 12h as requested previously
        const maxHour = i === 0 ? 11 : 22; 
        const saleDate = addHours(currentDate, faker.number.int({ min: 10, max: maxHour }));
        const seller = s % 3 === 0 ? users["Atendente"] : users["Everton"];
        
        const sale = await prisma.sale.create({
          data: {
            date: saleDate,
            companyId: company.id,
            userId: seller.id,
            status: SaleStatus.ACTIVE,
            totalAmount: 0, totalCost: 0, discountAmount: 0,
          }
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

    // 6. Manual Adjustments
    console.log("🔧 Adding demo adjustments...");
    const adjustmentReasons = [
      { reason: "Consumo Interno - Staff", item: null },
      { reason: "Consumo Interno - Gestão", item: null },
      { reason: "Perda/Quebra - Long Neck", item: "Cerveja Long Neck 330ml" },
      { reason: "Produto Vencido - Frango", item: "Peito de Frango", type: "INGREDIENT" },
    ];

    for (let a = 0; a < 15; a++) {
      const adj = faker.helpers.arrayElement(adjustmentReasons);
      const userId = users[faker.helpers.arrayElement(["Everton", "Atendente"])].id;
      
      await prisma.stockMovement.create({
        data: {
          type: StockMovementType.ADJUSTMENT,
          companyId: company.id,
          userId: userId,
          reason: adj.reason,
          productId: adj.item && products[adj.item] ? products[adj.item].id : null,
          ingredientId: adj.type === "INGREDIENT" && adj.item && ingredients[adj.item] ? ingredients[adj.item].id : null,
          stockBefore: 50,
          stockAfter: 48,
          quantityDecimal: 2,
          createdAt: subDays(today, faker.number.int({ min: 1, max: 60 })),
        }
      });
    }

    // 7. Audit Events
    console.log("🕵️ Generating demo audit trail...");
    const auditEvents = [
      { type: AuditEventType.PRODUCT_CREATED, actor: "Matheus", metadata: { name: "Combo Happy Hour" } },
      { type: AuditEventType.STOCK_ADJUSTED, actor: "Everton", metadata: { reason: "Quebra de Vidro", qty: 5 } },
    ];

    for (const event of auditEvents) {
      await prisma.auditEvent.create({
        data: {
          type: event.type,
          actorId: users[event.actor].id,
          companyId: company.id,
          metadata: event.metadata,
          severity: AuditSeverity.INFO,
          actorName: event.actor,
          actorEmail: users[event.actor].email,
        }
      });
    }
  } else {
    console.log("ℹ️ History already exists, skipping demo data generation.");
  }

  console.log("✅ Update complete! Robust seed with demo data ready.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
