import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

import { SaleService } from "@/app/_services/sale";
import { setTestDb, cleanDatabase, createSaleTestFixture } from "../helpers/test-db";
import { BusinessError } from "@/app/_lib/errors";

describe("Stock Logic — Negative Stock Constraints", () => {
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

  it("should fail when selling more than available for REVENDA if allowNegativeStock is false", async () => {
    const { company, user, refri } = await createSaleTestFixture();

    // 10 units available. Sell 11.
    await expect(
      SaleService.upsertSale({
        companyId: company.id,
        userId: user.id,
        products: [{ id: refri.id, quantity: 11 }],
      })
    ).rejects.toThrow(BusinessError);
  });

  it("should permit selling more than available for REVENDA if allowNegativeStock is true", async () => {
    const { company, user, refri } = await createSaleTestFixture();

    await testDb.company.update({
      where: { id: company.id },
      data: { allowNegativeStock: true },
    });

    const sale = await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: refri.id, quantity: 11 }],
    });

    expect(sale).toBeDefined();
    
    const product = await testDb.product.findUnique({ where: { id: refri.id } });
    expect(Number(product!.stock)).toBe(-1);
  });

  it("should fail when an ingredient (MTO) is missing but required, if allowNegativeStock is false", async () => {
    const { company, user, combo, pao } = await createSaleTestFixture();

    // Set pao stock to 1.
    await testDb.product.update({
      where: { id: pao.id },
      data: { stock: 1 },
    });

    // Selling 2 combos (needs 2 pao)
    await expect(
      SaleService.upsertSale({
        companyId: company.id,
        userId: user.id,
        products: [{ id: combo.id, quantity: 2 }],
      })
    ).rejects.toThrow(BusinessError);
  });

  it("should fallback to product own stock if MTO has no ingredients", async () => {
    const { company, user, hamburguer } = await createSaleTestFixture();

    // Delete composition for hamburguer (simulate misconfigured MTO)
    await testDb.productComposition.deleteMany({
      where: { parentId: hamburguer.id },
    });

    // Should deduct from hamburguer itself. 10 - 2 = 8.
    await SaleService.upsertSale({
      companyId: company.id,
      userId: user.id,
      products: [{ id: hamburguer.id, quantity: 2 }],
    });

    const product = await testDb.product.findUnique({ where: { id: hamburguer.id } });
    expect(Number(product!.stock)).toBe(8);
  });
});
