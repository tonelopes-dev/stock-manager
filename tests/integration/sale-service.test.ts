/**
 * ============================================================
 * INTEGRATION TEST: SaleService — Recursive Stock Deduction
 * ============================================================
 *
 * Hierarchy under test:
 *   COMBO (Combo Rota Burger)
 *     ├── PRODUCAO_PROPRIA (Hambúrguer Artesanal)
 *     │     ├── INSUMO (Pão de Hambúrguer)     → qty: 1
 *     │     ├── INSUMO (Carne Bovina)           → qty: 0.18 kg
 *     │     └── INSUMO (Queijo Cheddar)         → qty: 0.03 kg
 *     └── REVENDA (Refrigerante Lata 350ml)     → qty: 1
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// ──────────────────────────────────────────────
// 1. Create PrismaClient in vi.hoisted (runs before import hoisting)
//    We must use require() here because ESM imports are hoisted above vi.hoisted
// ──────────────────────────────────────────────
const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

// ──────────────────────────────────────────────
// 2. Mock the app's Prisma singleton to use testDb
// ──────────────────────────────────────────────
vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

// ──────────────────────────────────────────────
// 3. Import service (uses the mocked db) and helpers
// ──────────────────────────────────────────────
import { SaleService } from "@/app/_services/sale";
import { setTestDb, cleanDatabase, createSaleTestFixture } from "../helpers/test-db";

describe("SaleService — Recursive Stock Deduction", () => {
  beforeAll(async () => {
    setTestDb(testDb);
    await testDb.$connect();
  });

  afterAll(async () => {
    await cleanDatabase();
    await testDb.$disconnect();
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  // ============================================================
  // TEST 1: Selling a COMBO recursively deducts ALL leaf nodes
  // ============================================================
  it("should recursively deduct stock from all leaf insumos when selling a COMBO", async () => {
    const { company, user, pao, carne, queijo, refri, hamburguer, combo } =
      await createSaleTestFixture();

    const sale = await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: combo.id, quantity: 1 }],
    });

    expect(sale).toBeDefined();
    expect(sale.id).toBeDefined();

    const comboAfter = await testDb.product.findUnique({ where: { id: combo.id } });
    const hamburguerAfter = await testDb.product.findUnique({ where: { id: hamburguer.id } });
    const paoAfter = await testDb.product.findUnique({ where: { id: pao.id } });
    const carneAfter = await testDb.product.findUnique({ where: { id: carne.id } });
    const queijoAfter = await testDb.product.findUnique({ where: { id: queijo.id } });
    const refriAfter = await testDb.product.findUnique({ where: { id: refri.id } });

    // Combo: 10 - 1 = 9
    expect(Number(comboAfter!.stock)).toBe(9);
    // Hambúrguer (child of Combo): 10 - 1 = 9
    expect(Number(hamburguerAfter!.stock)).toBe(9);
    // Pão (leaf): 10 - (1 * 1) = 9
    expect(Number(paoAfter!.stock)).toBe(9);
    // Carne (leaf): 10 - (1 * 0.18) = 9.82
    expect(Number(carneAfter!.stock)).toBeCloseTo(9.82, 2);
    // Queijo (leaf): 10 - (1 * 0.03) = 9.97
    expect(Number(queijoAfter!.stock)).toBeCloseTo(9.97, 2);
    // Refrigerante (direct child, REVENDA): 10 - 1 = 9
    expect(Number(refriAfter!.stock)).toBe(9);
  });

  // ============================================================
  // TEST 2: baseCost snapshot is saved correctly in SaleItem
  // ============================================================
  it("should snapshot the product cost in SaleItem.baseCost at time of sale", async () => {
    const { company, user, combo } = await createSaleTestFixture();

    await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: combo.id, quantity: 2 }],
    });

    const saleItem = await testDb.saleItem.findFirst({
      where: { productId: combo.id },
    });

    expect(saleItem).toBeDefined();
    expect(Number(saleItem!.baseCost)).toBe(14.5);
    expect(Number(saleItem!.totalCost)).toBe(29);
    expect(Number(saleItem!.totalAmount)).toBe(70);
  });

  // ============================================================
  // TEST 3: Selling 3x Combo multiplies deductions correctly
  // ============================================================
  it("should multiply all deductions when selling 3 units of a combo", async () => {
    const { company, user, pao, carne, queijo, refri, combo } =
      await createSaleTestFixture();

    await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: combo.id, quantity: 3 }],
    });

    const paoAfter = await testDb.product.findUnique({ where: { id: pao.id } });
    const carneAfter = await testDb.product.findUnique({ where: { id: carne.id } });
    const queijoAfter = await testDb.product.findUnique({ where: { id: queijo.id } });
    const refriAfter = await testDb.product.findUnique({ where: { id: refri.id } });

    // Pão: 10 - (3 * 1) = 7
    expect(Number(paoAfter!.stock)).toBe(7);
    // Carne: 10 - (3 * 0.18) = 9.46
    expect(Number(carneAfter!.stock)).toBeCloseTo(9.46, 2);
    // Queijo: 10 - (3 * 0.03) = 9.91
    expect(Number(queijoAfter!.stock)).toBeCloseTo(9.91, 2);
    // Refri: 10 - 3 = 7
    expect(Number(refriAfter!.stock)).toBe(7);
  });

  // ============================================================
  // TEST 4: StockMovements are recorded for every node in the tree
  // ============================================================
  it("should create StockMovement records for every product in the tree", async () => {
    const { company, user, pao, carne, queijo, refri, hamburguer, combo } =
      await createSaleTestFixture();

    const sale = await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: combo.id, quantity: 1 }],
    });

    const movements = await testDb.stockMovement.findMany({
      where: { saleId: sale.id },
      orderBy: { createdAt: "asc" },
    });

    // 6 movements: Combo, Hambúrguer, Pão, Carne, Queijo, Refrigerante
    expect(movements.length).toBe(6);
    expect(movements.every((m: any) => m.type === "SALE")).toBe(true);

    const movedProductIds = movements.map((m: any) => m.productId);
    expect(movedProductIds).toContain(combo.id);
    expect(movedProductIds).toContain(hamburguer.id);
    expect(movedProductIds).toContain(pao.id);
    expect(movedProductIds).toContain(carne.id);
    expect(movedProductIds).toContain(queijo.id);
    expect(movedProductIds).toContain(refri.id);
  });

  // ============================================================
  // TEST 5: Selling a simple REVENDA product (no composition)
  // ============================================================
  it("should deduct stock for a simple product without composition", async () => {
    const { company, user, refri } = await createSaleTestFixture();

    await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: refri.id, quantity: 2 }],
    });

    const refriAfter = await testDb.product.findUnique({ where: { id: refri.id } });
    // 10 - 2 = 8
    expect(Number(refriAfter!.stock)).toBe(8);
  });

  // ============================================================
  // TEST 6: Ingredient stock MUST respect company setting
  // ============================================================
  it("should reject sale if an ingredient goes negative and company setting prohibits it", async () => {
    const { company, user, combo, pao } = await createSaleTestFixture();

    await testDb.product.update({
      where: { id: pao.id },
      data: { stock: 1 },
    });

    // Selling 3 combos (needs 3 pao, but only 1 available)
    await expect(
      SaleService.upsertSale({
        companyId: company.id,
        userId: user.id,
        products: [{ id: combo.id, quantity: 3 }],
      })
    ).rejects.toThrow("Estoque insuficiente");
  });
});
