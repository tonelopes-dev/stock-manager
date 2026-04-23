import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// 1. Setup PrismaClient isolado
const { testDb } = vi.hoisted(() => {
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

// 2. Mocks de Infraestrutura
vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

vi.mock("@/app/_lib/auth", () => ({
  auth: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
  handlers: {},
}));

vi.mock("@/app/_lib/get-current-company", () => ({
  getCurrentCompanyId: vi.fn(async () => "test-company"),
}));

vi.mock("@/app/_lib/rbac", () => ({
  assertRole: vi.fn(),
  ADMIN_AND_OWNER: ["OWNER", "ADMIN"],
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { setTestDb, cleanDatabase, createSaleTestFixture } from "../helpers/test-db";
import { createStockEntry } from "@/app/_actions/stock-entry/create-stock-entry";
import { assertRole } from "@/app/_lib/rbac";

describe("Stock Entry — Supplier ID Handling", () => {
  let testData: any;

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
    testData = await createSaleTestFixture();

    // Mock assertRole to return the real fixture user ID
    vi.mocked(assertRole).mockResolvedValue({
      role: "OWNER",
      userId: testData.user.id,
    });
  });

  it("should successfully create a stock entry with an empty string supplierId (transformed to undefined)", async () => {
    const result = await createStockEntry({
      productId: testData.pao.id,
      supplierId: "", // Simula o form enviando string vazia
      quantity: 10,
      unitCost: 5,
      date: new Date(),
    });

    expect(result?.data).toBeDefined();
    
    const entry = await testDb.stockEntry.findFirst({
        where: { productId: testData.pao.id }
    });
    
    expect(entry).not.toBeNull();
    expect(entry?.supplierId).toBeNull();
    expect(Number(entry?.quantity)).toBe(10);
  });

  it("should successfully create a stock entry with a valid supplierId", async () => {
    const supplier = await testDb.supplier.create({
        data: {
            name: "Test Supplier",
            companyId: testData.company.id
        }
    });

    const result = await createStockEntry({
      productId: testData.pao.id,
      supplierId: supplier.id,
      quantity: 5,
      unitCost: 10,
      date: new Date(),
    });

    expect(result?.data).toBeDefined();
    
    const entry = await testDb.stockEntry.findFirst({
        where: { quantity: 5 }
    });
    
    expect(entry?.supplierId).toBe(supplier.id);
  });
});
