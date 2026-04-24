/**
 * E2E Database Factory
 *
 * Creates isolated test data directly in the database via Prisma.
 * Used in Playwright global-setup to guarantee tests always have
 * fresh, predictable data — regardless of the dev DB state.
 *
 * NOTE: This uses the SAME database as the dev server (not a test DB).
 * All factory-created data is prefixed with "e2e-" to avoid collisions.
 */
import { PrismaClient, ProductType, UnitType, SubscriptionStatus, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

// Deterministic IDs for cross-reference
const E2E_COMPANY_ID = "e2e-rota-360-company";
const E2E_COMPANY_SLUG = "e2e-rota-360";

export interface E2EFixture {
  companyId: string;
  companySlug: string;
  products: Record<string, { id: string; name: string; price: number }>;
  categories: Record<string, { id: string; name: string }>;
}

/**
 * Ensures the test company, user, products, and categories exist.
 * Uses upsert for idempotency — safe to call multiple times.
 */
export async function seedE2EData(): Promise<E2EFixture> {
  console.log("🏭 [E2E Factory] Cleaning up and seeding test data...");
  
  // Cleanup first to ensure isolation
  await cleanupE2EOrders();

  // ─── 1. Company ────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { id: E2E_COMPANY_ID },
    update: {
      name: "Rota 360",
      slug: E2E_COMPANY_SLUG,
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    create: {
      id: E2E_COMPANY_ID,
      name: "Rota 360",
      slug: E2E_COMPANY_SLUG,
      plan: "PRO",
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      allowNegativeStock: false,
    },
  });

  // ─── 2. User (Owner) ──────────────────────────────────────
  const hashedPassword = await hash("senha123", 10);
  const E2E_USER_EMAIL = "e2e-matheus@rota360.com";

  const owner = await prisma.user.upsert({
    where: { email: E2E_USER_EMAIL },
    update: { name: "Matheus E2E" },
    create: {
      name: "Matheus E2E",
      email: E2E_USER_EMAIL,
      password: hashedPassword,
    },
  });

  // Cleanup other company associations for this specific E2E user 
  // (to ensure deterministic getCurrentCompanyId behavior)
  await prisma.userCompany.deleteMany({
    where: { userId: owner.id, companyId: { not: E2E_COMPANY_ID } }
  });

  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: owner.id, companyId: company.id } },
    update: { role: UserRole.OWNER },
    create: {
      userId: owner.id,
      companyId: company.id,
      role: UserRole.OWNER,
    },
  });

  // ─── 3. Categories ────────────────────────────────────────
  const categoryData = [
    { name: "Bebidas", icon: "GlassWater", order: 0 },
    { name: "Salgados", icon: "Utensils", order: 1 },
    { name: "Combos", icon: "Layers", order: 2 },
  ];

  const categories: Record<string, { id: string; name: string }> = {};
  for (const cat of categoryData) {
    const category = await prisma.category.upsert({
      where: { name_companyId: { name: cat.name, companyId: company.id } },
      update: { icon: cat.icon, orderIndex: cat.order },
      create: {
        name: cat.name,
        icon: cat.icon,
        companyId: company.id,
        orderIndex: cat.order,
      },
    });
    categories[cat.name] = { id: category.id, name: category.name };
  }

  // ─── 4. Environment (KDS stations) ────────────────────────
  const envCozinha = await prisma.environment.upsert({
    where: { name_companyId: { name: "Cozinha", companyId: company.id } },
    update: {},
    create: { name: "Cozinha", companyId: company.id },
  });

  const envBar = await prisma.environment.upsert({
    where: { name_companyId: { name: "Bar", companyId: company.id } },
    update: {},
    create: { name: "Bar", companyId: company.id },
  });

  // ─── 5. Products ──────────────────────────────────────────
  const products: Record<string, { id: string; name: string; price: number }> = {};

  // 5a. Revenda — Coca-Cola (Bebidas, Bar)
  const coca = await prisma.product.upsert({
    where: { sku_companyId: { sku: "e2e-coca-350ml", companyId: company.id } },
    update: {
      price: 7.0,
      isVisibleOnMenu: true,
      isActive: true,
      environmentId: envBar.id,
      categoryId: categories["Bebidas"].id,
    },
    create: {
      name: "Coca-Cola 350ml",
      sku: "e2e-coca-350ml",
      type: ProductType.REVENDA,
      price: 7.0,
      cost: 2.5,
      stock: 100,
      minStock: 10,
      unit: UnitType.UN,
      companyId: company.id,
      categoryId: categories["Bebidas"].id,
      environmentId: envBar.id,
      isVisibleOnMenu: true,
      isActive: true,
    },
  });
  products["Coca-Cola 350ml"] = { id: coca.id, name: coca.name, price: 7.0 };

  // 5b. Produção Própria — Hambúrguer (Salgados, Cozinha)
  const pao = await prisma.product.upsert({
    where: { sku_companyId: { sku: "e2e-pao-hamburger", companyId: company.id } },
    update: { cost: 1.2 },
    create: {
      name: "E2E Pão de Hambúrguer",
      sku: "e2e-pao-hamburger",
      type: ProductType.INSUMO,
      price: 0,
      cost: 1.2,
      stock: 200,
      minStock: 20,
      unit: UnitType.UN,
      companyId: company.id,
      isVisibleOnMenu: false,
    },
  });

  const carne = await prisma.product.upsert({
    where: { sku_companyId: { sku: "e2e-carne-blend", companyId: company.id } },
    update: { cost: 38.0 },
    create: {
      name: "E2E Carne Bovina (Blend)",
      sku: "e2e-carne-blend",
      type: ProductType.INSUMO,
      price: 0,
      cost: 38.0,
      stock: 20,
      minStock: 5,
      unit: UnitType.KG,
      companyId: company.id,
      isVisibleOnMenu: false,
    },
  });

  const hamburguer = await prisma.product.upsert({
    where: { sku_companyId: { sku: "e2e-hamburguer-caseiro", companyId: company.id } },
    update: {
      price: 28.0,
      isVisibleOnMenu: true,
      isActive: true,
      environmentId: envCozinha.id,
      categoryId: categories["Salgados"].id,
    },
    create: {
      name: "Hambúrguer Caseiro",
      sku: "e2e-hamburguer-caseiro",
      type: ProductType.PRODUCAO_PROPRIA,
      price: 28.0,
      cost: 12.0,
      stock: 20,
      minStock: 5,
      unit: UnitType.UN,
      companyId: company.id,
      categoryId: categories["Salgados"].id,
      environmentId: envCozinha.id,
      isMadeToOrder: false,
      isVisibleOnMenu: true,
      isActive: true,
    },
  });
  products["Hambúrguer Caseiro"] = { id: hamburguer.id, name: hamburguer.name, price: 28.0 };

  // Composition: Hambúrguer = 1 Pão + 0.18kg Carne
  for (const comp of [
    { childId: pao.id, quantity: 1 },
    { childId: carne.id, quantity: 0.18 },
  ]) {
    await prisma.productComposition.upsert({
      where: { parentId_childId: { parentId: hamburguer.id, childId: comp.childId } },
      update: { quantity: comp.quantity },
      create: { parentId: hamburguer.id, childId: comp.childId, quantity: comp.quantity },
    });
  }

  // 5c. Combo — Burger + Coca (Combos, Cozinha)
  const combo = await prisma.product.upsert({
    where: { sku_companyId: { sku: "e2e-combo-burger-coca", companyId: company.id } },
    update: {
      price: 32.0,
      isVisibleOnMenu: true,
      isActive: true,
      environmentId: envCozinha.id,
      categoryId: categories["Combos"].id,
    },
    create: {
      name: "Combo Burger + Coca",
      sku: "e2e-combo-burger-coca",
      type: ProductType.COMBO,
      price: 32.0,
      cost: 14.5,
      stock: 0,
      unit: UnitType.UN,
      companyId: company.id,
      categoryId: categories["Combos"].id,
      environmentId: envCozinha.id,
      isMadeToOrder: true,
      isVisibleOnMenu: true,
      isActive: true,
    },
  });
  products["Combo Burger + Coca"] = { id: combo.id, name: combo.name, price: 32.0 };

  // Combo composition: Hambúrguer + Coca
  for (const comp of [
    { childId: hamburguer.id, quantity: 1 },
    { childId: coca.id, quantity: 1 },
  ]) {
    await prisma.productComposition.upsert({
      where: { parentId_childId: { parentId: combo.id, childId: comp.childId } },
      update: { quantity: comp.quantity },
      create: { parentId: combo.id, childId: comp.childId, quantity: comp.quantity },
    });
  }

  console.log("✅ [E2E Factory] Seed complete.");
  console.log(`   🏢 Company: ${company.name} (slug: ${E2E_COMPANY_SLUG})`);
  console.log(`   📦 Products: ${Object.keys(products).join(", ")}`);

  return {
    companyId: company.id,
    companySlug: E2E_COMPANY_SLUG,
    products,
    categories,
  };
}

/**
 * Cleanup: Delete only E2E-specific orders to avoid polluting
 * subsequent test runs. We do NOT delete products/company
 * because the upsert pattern handles idempotency.
 */
export async function cleanupE2EOrders(): Promise<void> {
  console.log("🧹 [E2E Factory] Cleaning up E2E orders...");

  // Delete order items and orders for the E2E company only
  await prisma.orderItem.deleteMany({
    where: { order: { companyId: E2E_COMPANY_ID } },
  });
  await prisma.order.deleteMany({
    where: { companyId: E2E_COMPANY_ID },
  });

  console.log("✅ [E2E Factory] Cleanup complete.");
}

export async function disconnect(): Promise<void> {
  await prisma.$disconnect();
}
