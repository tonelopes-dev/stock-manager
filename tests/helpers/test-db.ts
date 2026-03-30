/**
 * Test Database Helper
 *
 * Provides cleanup and fixture utilities for integration tests.
 * The actual PrismaClient instance (testDb) is injected from the test file
 * to avoid circular dependency issues with vi.mock.
 */
import { PrismaClient, ProductType, UnitType } from "@prisma/client";

// This will be set by the test file before tests run
export let testDb: PrismaClient;

export function setTestDb(client: PrismaClient) {
  testDb = client;
}

/**
 * Truncate all tables to ensure isolation between tests.
 * Order matters due to FK constraints.
 */
export async function cleanDatabase() {
  await testDb.stockMovement.deleteMany();
  await testDb.saleItem.deleteMany();
  await testDb.sale.deleteMany();
  await testDb.orderItem.deleteMany();
  await testDb.order.deleteMany();
  await testDb.productComposition.deleteMany();
  await testDb.productionOrder.deleteMany();
  await testDb.goal.deleteMany();
  await testDb.product.deleteMany();
  await testDb.category.deleteMany();
  await testDb.environment.deleteMany();
  await testDb.checklistItem.deleteMany();
  await testDb.checklist.deleteMany();
  await testDb.checklistTemplate.deleteMany();
  await testDb.notification.deleteMany();
  await testDb.customer.deleteMany();
  await testDb.customerCategory.deleteMany();
  await testDb.cRMStage.deleteMany();
  await testDb.auditEvent.deleteMany();
  await testDb.companyInvitation.deleteMany();
  await testDb.userCompany.deleteMany();
  await testDb.session.deleteMany();
  await testDb.account.deleteMany();
  await testDb.user.deleteMany();
  await testDb.company.deleteMany();
}

/**
 * Creates the minimal fixture needed for a sale test:
 * Company, User, Products (INSUMO, PRODUCAO_PROPRIA, REVENDA, COMBO)
 * with compositions and initial stock.
 */
export async function createSaleTestFixture() {
  // 1. Company
  const company = await testDb.company.create({
    data: {
      id: "test-company",
      name: "Test Company",
      allowNegativeStock: false,
    },
  });

  // 2. User
  const user = await testDb.user.create({
    data: {
      email: "test@test.com",
      name: "Test User",
      password: "hashed",
    },
  });

  await testDb.userCompany.create({
    data: {
      userId: user.id,
      companyId: company.id,
      role: "OWNER",
    },
  });

  // 3. Insumos (raw materials) — 10 units each
  const pao = await testDb.product.create({
    data: {
      name: "Pão de Hambúrguer",
      type: ProductType.INSUMO,
      price: 0,
      cost: 1.2,
      stock: 10,
      unit: UnitType.UN,
      companyId: company.id,
      sku: "insumo-pao",
    },
  });

  const carne = await testDb.product.create({
    data: {
      name: "Carne Bovina (Blend)",
      type: ProductType.INSUMO,
      price: 0,
      cost: 38.0,
      stock: 10,
      unit: UnitType.KG,
      companyId: company.id,
      sku: "insumo-carne",
    },
  });

  const queijo = await testDb.product.create({
    data: {
      name: "Queijo Cheddar",
      type: ProductType.INSUMO,
      price: 0,
      cost: 42.0,
      stock: 10,
      unit: UnitType.KG,
      companyId: company.id,
      sku: "insumo-queijo",
    },
  });

  // 4. Revenda — 10 units
  const refri = await testDb.product.create({
    data: {
      name: "Refrigerante Lata 350ml",
      type: ProductType.REVENDA,
      price: 7.0,
      cost: 2.5,
      stock: 10,
      unit: UnitType.UN,
      companyId: company.id,
      sku: "revenda-refri",
    },
  });

  // 5. Produção Própria: Hambúrguer
  const hamburguer = await testDb.product.create({
    data: {
      name: "Hambúrguer Artesanal",
      type: ProductType.PRODUCAO_PROPRIA,
      price: 32.0,
      cost: 12.0,
      stock: 10,
      unit: UnitType.UN,
      companyId: company.id,
      sku: "prod-hamburguer",
    },
  });

  // Hambúrguer composition: 1 Pão + 0.18kg Carne + 0.03kg Queijo
  await testDb.productComposition.createMany({
    data: [
      { parentId: hamburguer.id, childId: pao.id, quantity: 1 },
      { parentId: hamburguer.id, childId: carne.id, quantity: 0.18 },
      { parentId: hamburguer.id, childId: queijo.id, quantity: 0.03 },
    ],
  });

  // 6. Combo: Hambúrguer + Refri
  const combo = await testDb.product.create({
    data: {
      name: "Combo Rota Burger",
      type: ProductType.COMBO,
      price: 35.0,
      cost: 14.5,
      stock: 10,
      unit: UnitType.UN,
      companyId: company.id,
      sku: "combo-rota-burger",
    },
  });

  // Combo composition: 1 Hambúrguer + 1 Refri
  await testDb.productComposition.createMany({
    data: [
      { parentId: combo.id, childId: hamburguer.id, quantity: 1 },
      { parentId: combo.id, childId: refri.id, quantity: 1 },
    ],
  });

  return { company, user, pao, carne, queijo, refri, hamburguer, combo };
}
