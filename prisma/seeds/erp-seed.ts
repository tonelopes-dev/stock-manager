import { PrismaClient, ProductType, UnitType } from "@prisma/client";
import { addDays, subDays } from "date-fns";

export async function seedERPData(prisma: PrismaClient, userId: string) {
  console.log("🚀 Starting Analytical Data Injections (No deletion Mode)...");
  
  console.log("🏢 Seeding Kipo Restaurante (Food Service)...");
  const restaurantId = "rota-360-id";
  await seedRestaurant(prisma, restaurantId, userId);

  console.log("🏢 Seeding Kipo Coworking (Services & Retail)...");
  const coworkingId = "kipo-coworking-id";
  await seedCoworking(prisma, coworkingId, userId);

  console.log("✅ Enterprise Multi-Tenant Seed Finished!");
}

async function seedRestaurant(prisma: PrismaClient, companyId: string, userId: string) {
  // 1. Company and Categories
  await prisma.company.upsert({
    where: { id: companyId },
    update: { name: "Kipo Restaurante", plan: "ENTERPRISE" },
    create: { id: companyId, name: "Kipo Restaurante", plan: "ENTERPRISE" },
  });

  const categories = ["Pratos Principais", "Sobremesas", "Bebidas", "Insumos de Cozinha"];
  const categoryMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, companyId },
    });
    categoryMap[name] = cat.id;
  }

  // 2. Suppliers
  const suppliersData = [
    { name: "Atacadão Corporativo", email: "vendas@atacadao.corp" },
    { name: "Distribuidora Master Alimentos", email: "contato@masteralimentos.com.br" },
  ];
  const suppliers = [];
  for (const s of suppliersData) {
    const supplier = await prisma.supplier.upsert({
      where: { name_companyId: { name: s.name, companyId } },
      update: {},
      create: { ...s, companyId },
    });
    suppliers.push(supplier);
  }

  // 3. Products (15+ items)
  const products = [
    { name: "Bife Ancho (Peça)", cat: "Insumos de Cozinha", type: "INSUMO", unit: "KG", cost: 65.0, price: 0 },
    { name: "Risoto de Funghi", cat: "Pratos Principais", type: "PRODUCAO_PROPRIA", unit: "UN", cost: 22.0, price: 58.0 },
    { name: "Pudim de Leite", cat: "Sobremesas", type: "PRODUCAO_PROPRIA", unit: "UN", cost: 8.5, price: 18.0 },
    { name: "Heineken Lata 350ml", cat: "Bebidas", type: "REVENDA", unit: "UN", cost: 4.8, price: 12.0 },
    { name: "Tomate Cereja (Bandeja)", cat: "Insumos de Cozinha", type: "INSUMO", unit: "UN", cost: 6.5, price: 0 },
    { name: "Farinha de Trigo", cat: "Insumos de Cozinha", type: "INSUMO", unit: "KG", cost: 4.2, price: 0 },
    { name: "Queijo Parmesão", cat: "Insumos de Cozinha", type: "INSUMO", unit: "KG", cost: 85.0, price: 0 },
    { name: "Vinho Tinto Reserva", cat: "Bebidas", type: "REVENDA", unit: "UN", cost: 45.0, price: 120.0 },
    { name: "Alface Americana", cat: "Insumos de Cozinha", type: "INSUMO", unit: "UN", cost: 3.5, price: 0 },
    { name: "Cebola Roxa", cat: "Insumos de Cozinha", type: "INSUMO", unit: "KG", cost: 5.8, price: 0 },
    { name: "Óleo de Girassol", cat: "Insumos de Cozinha", type: "INSUMO", unit: "L", cost: 8.2, price: 0 },
    { name: "Filé Mignon", cat: "Insumos de Cozinha", type: "INSUMO", unit: "KG", cost: 95.0, price: 0 },
    { name: "Chocolate Meio Amargo", cat: "Insumos de Cozinha", type: "INSUMO", unit: "KG", cost: 42.0, price: 0 },
    { name: "Água com Gás", cat: "Bebidas", type: "REVENDA", unit: "UN", cost: 1.8, price: 6.0 },
    { name: "Coca-Cola Zero", cat: "Bebidas", type: "REVENDA", unit: "UN", cost: 3.2, price: 8.0 },
  ];

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku: p.name.toLowerCase().replace(/ /g, "-"), companyId } },
      update: { type: p.type as any, price: p.price, cost: p.cost, categoryId: categoryMap[p.cat] },
      create: {
        name: p.name,
        sku: p.name.toLowerCase().replace(/ /g, "-"),
        type: p.type as any,
        unit: p.unit as any,
        price: p.price,
        cost: p.cost,
        stock: i % 5 === 0 ? 0 : 50, // Some out of stock
        minStock: 10,
        companyId,
        categoryId: categoryMap[p.cat],
        trackExpiration: p.type === "INSUMO" || p.type === "REVENDA",
      },
    });

    if (p.type !== "PRODUCAO_PROPRIA") {
      await generateHistoricalData(prisma, product, suppliers, userId, companyId, true);
    }
  }
}

async function seedCoworking(prisma: PrismaClient, companyId: string, userId: string) {
  // 1. Company and Categories
  await prisma.company.upsert({
    where: { id: companyId },
    update: { name: "Kipo Coworking", plan: "PRO" },
    create: { id: companyId, name: "Kipo Coworking", plan: "PRO" },
  });

  const categories = ["Planos de Acesso", "Salas de Reunião", "Lanchonete"];
  const categoryMap: Record<string, string> = {};
  for (const name of categories) {
    const cat = await prisma.category.upsert({
      where: { name_companyId: { name, companyId } },
      update: {},
      create: { name, companyId },
    });
    categoryMap[name] = cat.id;
  }

  // 2. Suppliers
  const supplier = await prisma.supplier.upsert({
    where: { name_companyId: { name: "Nespresso Brasil", companyId } },
    update: {},
    create: { name: "Nespresso Brasil", companyId },
  });

  // 3. Products
  const productsData = [
    { name: "Day Pass Individual", cat: "Planos de Acesso", type: "REVENDA", stockable: false, cost: 0, price: 80 },
    { name: "Reserva Sala de Reunião (1h)", cat: "Salas de Reunião", type: "REVENDA", stockable: false, cost: 0, price: 150 },
    { name: "Café em Cápsula (Packs)", cat: "Lanchonete", type: "REVENDA", stockable: true, cost: 22.0, price: 45.0 },
    { name: "Impressão A4 (Resma)", cat: "Lanchonete", type: "INSUMO", stockable: true, cost: 35.0, price: 0 },
  ];

  for (const p of productsData) {
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku: p.name.toLowerCase().replace(/ /g, "-"), companyId } },
      update: { categoryId: categoryMap[p.cat] },
      create: {
        name: p.name,
        sku: p.name.toLowerCase().replace(/ /g, "-"),
        type: p.type as any,
        unit: "UN",
        price: p.price,
        cost: p.cost,
        stock: p.stockable ? 20 : 0,
        minStock: p.stockable ? 5 : 0,
        companyId,
        categoryId: categoryMap[p.cat],
        trackExpiration: p.stockable,
      },
    });

    if (p.stockable) {
      await generateHistoricalData(prisma, product, [supplier], userId, companyId, false);
    }
  }
}

async function generateHistoricalData(prisma: PrismaClient, product: any, suppliers: any[], userId: string, companyId: string, withInflation: boolean) {
  const now = new Date();
  const intervals = [7, 30]; // weekly and monthly buy patterns
  const interval = intervals[Math.floor(Math.random() * intervals.length)];

  for (let d = 60; d >= 0; d -= interval) {
    const entryDate = subDays(now, d);
    const supplier = suppliers[d % suppliers.length];
    
    // Inflation simulation (+0.5% each step if withInflation)
    const inflationFactor = withInflation ? 1 + ( (60 - d) / 60 * 0.15 ) : 1; 
    const baseCost = Number(product.cost);
    const unitCost = baseCost * inflationFactor * (0.95 + Math.random() * 0.1); // +/- 5% variance

    const quantity = Math.floor(Math.random() * 10) + 5;

    await prisma.stockEntry.create({
      data: {
        productId: product.id,
        supplierId: supplier.id,
        companyId,
        userId,
        quantity,
        unitCost,
        totalCost: unitCost * quantity,
        invoiceNumber: `NF-${Math.floor(Math.random() * 90000) + 10000}`,
        createdAt: entryDate,
        expirationDate: (product.trackExpiration && d === 0) 
          ? (Math.random() > 0.8 ? subDays(now, 2) : addDays(now, 15)) // 20% chance of being expired for current batch
          : null,
      }
    });
  }
}
