import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// 1. Setup PrismaClient in vi.hoisted
const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

// 2. Mock Prisma singleton
vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

// 3. Mock Next.js and Auth helpers
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

vi.mock("@/app/_lib/subscription-guard", () => ({
  requireActiveSubscription: vi.fn(async () => true),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { adjustStock } from "@/app/_actions/product/adjust-stock";
import { setTestDb, cleanDatabase, createSaleTestFixture } from "../helpers/test-db";
import { assertRole } from "@/app/_lib/rbac";

describe("Integration Test — adjustStock Server Action", () => {
  let fixture: any;

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
    fixture = await createSaleTestFixture();
    
    // Configure default mocks to match fixture
    vi.mocked(assertRole).mockResolvedValue({
      role: "OWNER",
      userId: fixture.user.id,
    });
  });

  it("Scenario A: Positive Integer Adjustment (Stock 0 -> 10)", async () => {
    const { refri } = fixture;
    
    // Ensure stock starts at 0
    await testDb.product.update({
      where: { id: refri.id },
      data: { stock: 0 }
    });

    const result = await adjustStock({
      id: refri.id,
      quantity: 10,
      reason: "Inventário Inicial"
    });

    // Check database state directly
    const updatedProduct = await testDb.product.findUnique({
      where: { id: refri.id },
      select: { stock: true }
    });

    expect(Number(updatedProduct?.stock)).toBe(10);

    // Verify StockMovement creation
    const movement = await testDb.stockMovement.findFirst({
      where: { productId: refri.id, type: "ADJUSTMENT" }
    });
    expect(movement).toBeDefined();
    expect(Number(movement?.quantityDecimal)).toBe(10);
    expect(Number(movement?.stockAfter)).toBe(10);
    expect(movement?.reason).toBe("Inventário Inicial");
  });

  it("Scenario B: Negative Adjustment (Stock 10 -> 7)", async () => {
    const { refri } = fixture;
    
    // Initial stock is 10 from fixture.
    await adjustStock({
      id: refri.id,
      quantity: -3,
      reason: "Ajuste de Quebra"
    });

    const updatedProduct = await testDb.product.findUnique({
      where: { id: refri.id },
      select: { stock: true }
    });

    // 10 - 3 = 7
    expect(Number(updatedProduct?.stock)).toBe(7);
  });

  it("Scenario C: Mandatory Decimal Precision (2.5 units)", async () => {
    const { carne } = fixture; // Insumo usually handled in KG
    
    await testDb.product.update({
      where: { id: carne.id },
      data: { stock: 0 }
    });

    await adjustStock({
      id: carne.id,
      quantity: 2.5,
      reason: "Pesagem Balança"
    });

    const updatedProduct = await testDb.product.findUnique({
      where: { id: carne.id },
      select: { stock: true }
    });

    // Verifying precision
    expect(Number(updatedProduct?.stock)).toBe(2.5);
    
    const movement = await testDb.stockMovement.findFirst({
      where: { productId: carne.id }
    });
    expect(Number(movement?.quantityDecimal)).toBe(2.5);
  });

  it("Scenario D: Validation Failure (Zero quantity)", async () => {
    const { refri } = fixture;

    // Sending zero quantity (violates Zod schema)
    const result = await adjustStock({
      id: refri.id,
      quantity: 0,
      reason: "Erro"
    });

    // next-safe-action returns validationErrors for Zod failures
    expect(result?.validationErrors).toBeDefined();
    expect(result?.validationErrors?.quantity).toBeDefined();
    
    // Stock should remain unchanged (10 from fixture)
    const product = await testDb.product.findUnique({
      where: { id: refri.id }
    });
    expect(Number(product?.stock)).toBe(10);
  });

  it("Scenario E: Security Failure (User not ADMIN/OWNER)", async () => {
    const { refri } = fixture;

    // Mock assertRole to throw error (simulate unauthorized)
    vi.mocked(assertRole).mockRejectedValueOnce(new Error("Ação não permitida"));

    // Action should return serverError or throw depending on safe-action config
    // In our case, it throws or returns serverError
    const result = await adjustStock({
      id: refri.id,
      quantity: 5,
      reason: "Ajuste"
    });

    expect(result?.serverError).toBeDefined();

    // Stock should not change
    const product = await testDb.product.findUnique({
      where: { id: refri.id }
    });
    expect(Number(product?.stock)).toBe(10);
  });
});
