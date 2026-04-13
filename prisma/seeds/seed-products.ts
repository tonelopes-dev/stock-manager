import { PrismaClient, ProductType, UnitType } from "@prisma/client";
import { addDays } from "date-fns";

export async function seedProducts(prisma: PrismaClient, companyId: string) {
  console.log("🥬 Seeding products and categories...");

  // 1. Categories
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
      where: { name_companyId: { name: cat.name, companyId } },
      update: { icon: cat.icon },
      create: { name: cat.name, icon: cat.icon, companyId },
    });
    productCategories[cat.name] = category;
  }

  // 2. Insumos (Raw Materials)
  const insumosData = [
    { name: "Farinha de Trigo", unit: UnitType.KG, cost: 4.5, stock: 50, minStock: 10 },
    { name: "Peito de Frango", unit: UnitType.KG, cost: 22.0, stock: 15, minStock: 8 },
    { name: "Requeijão", unit: UnitType.KG, cost: 35.0, stock: 10, minStock: 3 },
    { name: "Gin", unit: UnitType.UN, cost: 85.0, stock: 12, minStock: 3 },
    { name: "Tônica", unit: UnitType.L, cost: 12.0, stock: 24, minStock: 6 },
    { name: "Croissant Massa", unit: UnitType.UN, cost: 3.5, stock: 0, minStock: 10 }, // For exhausted batch test
    { name: "Pão de Hambúrguer", unit: UnitType.UN, cost: 1.2, stock: 200, minStock: 40 },
    { name: "Carne Bovina (Blend)", unit: UnitType.KG, cost: 38.0, stock: 20, minStock: 5 },
    { name: "Queijo Cheddar", unit: UnitType.KG, cost: 42.0, stock: 8, minStock: 2 },
  ];

  const insumos: Record<string, any> = {};
  for (const iData of insumosData) {
    const sku = `insumo-${iData.name.toLowerCase().replace(/[/ ]/g, "-")}`;
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId } },
      update: { cost: iData.cost, unit: iData.unit, type: ProductType.INSUMO },
      create: {
        name: iData.name,
        price: 0,
        cost: iData.cost,
        stock: iData.stock,
        minStock: iData.minStock,
        unit: iData.unit,
        sku,
        type: ProductType.INSUMO,
        companyId,
        categoryId: productCategories["Insumos"].id,
      },
    });
    insumos[iData.name] = product;
  }

  // 3. Resale Products
  const resellData = [
    { name: "Coca-Cola 350ml", price: 7.0, cost: 2.50, stock: 150, minStock: 24, category: "Bebidas", isLow: false },
    { name: "Cerveja Heineken", price: 15.0, cost: 6.80, stock: 2, minStock: 12, category: "Bebidas", isLow: true }, // Low stock test
  ];

  const products: Record<string, any> = {};
  for (const p of resellData) {
    const sku = p.name.toLowerCase().replace(/ /g, "-");
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId } },
      update: { price: p.price, cost: p.cost, categoryId: productCategories[p.category].id },
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: p.minStock,
        sku,
        type: ProductType.REVENDA,
        companyId,
        categoryId: productCategories[p.category].id,
      },
    });
    products[p.name] = product;
  }

  // 4. Production Products
  const productionData = [
    {
      name: "Gin Tônica Clássica",
      price: 32.0,
      cost: 10.5,
      stock: 0, 
      isMadeToOrder: true, // MTO
      category: "Bebidas",
      composition: [
        { insumo: "Gin", qty: 0.05 },
        { insumo: "Tônica", qty: 0.2 },
      ],
    },
    {
      name: "Croissant de Frango",
      price: 18.0,
      cost: 6.5,
      stock: 0, // Exhausted Batch
      isMadeToOrder: false, // BATCH
      category: "Salgados",
      composition: [
        { insumo: "Croissant Massa", qty: 1 },
        { insumo: "Peito de Frango", qty: 0.05 },
      ],
    },
    {
      name: "Hambúrguer Caseiro",
      price: 28.0,
      cost: 12.0,
      stock: 20, // Farto Batch
      isMadeToOrder: false,
      category: "Salgados",
      composition: [
        { insumo: "Pão de Hambúrguer", qty: 1 },
        { insumo: "Carne Bovina (Blend)", qty: 0.18 },
        { insumo: "Queijo Cheddar", qty: 0.05 },
      ],
    },
  ];

  for (const p of productionData) {
    const sku = p.name.toLowerCase().replace(/ /g, "-");
    const product = await prisma.product.upsert({
      where: { sku_companyId: { sku, companyId } },
      update: { 
        price: p.price, 
        cost: p.cost, 
        isMadeToOrder: p.isMadeToOrder,
        type: ProductType.PRODUCAO_PROPRIA 
      } as any,
      create: {
        name: p.name,
        price: p.price,
        cost: p.cost,
        stock: p.stock,
        minStock: 5,
        sku,
        isMadeToOrder: p.isMadeToOrder,
        type: ProductType.PRODUCAO_PROPRIA,
        companyId,
        categoryId: productCategories[p.category].id,
      } as any,
    });

    for (const comp of p.composition) {
      const child = insumos[comp.insumo];
      if (child) {
        await prisma.productComposition.upsert({
          where: { parentId_childId: { parentId: product.id, childId: child.id } },
          update: { quantity: comp.qty },
          create: { parentId: product.id, childId: child.id, quantity: comp.qty },
        });
      }
    }
    products[p.name] = product;
  }

  // 5. Combos
  const comboSku = "combo-burger-coca";
  const comboProduct = await prisma.product.upsert({
    where: { sku_companyId: { sku: comboSku, companyId } },
    update: { type: ProductType.COMBO },
    create: {
      name: "Combo Burger + Coca",
      price: 32.0,
      cost: 14.5,
      stock: 0,
      sku: comboSku,
      type: ProductType.COMBO,
      companyId,
      categoryId: productCategories["Combos"].id,
    },
  });

  const comboChildren = [
    { childName: "Hambúrguer Caseiro", qty: 1 },
    { childName: "Coca-Cola 350ml", qty: 1 },
  ];

  for (const cc of comboChildren) {
    const child = products[cc.childName];
    if (child) {
      await prisma.productComposition.upsert({
        where: { parentId_childId: { parentId: comboProduct.id, childId: child.id } },
        update: { quantity: cc.qty },
        create: { parentId: comboProduct.id, childId: child.id, quantity: cc.qty },
      });
    }
  }
  products[comboProduct.name] = comboProduct;

  return { categories: productCategories, insumos, products };
}
