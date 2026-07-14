import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";

// ──────────────────────────────────────────────
// 1. Create PrismaClient in vi.hoisted
// ──────────────────────────────────────────────
const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

// ──────────────────────────────────────────────
// 2. Mock Prisma and MercadoPago
// ──────────────────────────────────────────────
vi.mock("server-only", () => ({}));
vi.mock("@/app/_lib/auth", () => ({
  auth: vi.fn(),
  getCurrentCompanyId: vi.fn(() => "test-company"),
}));
vi.mock("next/server", () => ({
  NextResponse: class {
    public body: any;
    public status: number;
    constructor(body?: any, init?: any) {
      this.body = body;
      this.status = init?.status || 200;
    }
  },
}));

vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

// Mocks the Mercado Pago SDK
const mockPreferenceCreate = vi.fn().mockResolvedValue({
  id: "mock_preference_id",
  init_point: "https://sandbox.mercadopago.com.br/checkout/mock",
});
const mockPaymentGet = vi.fn().mockResolvedValue({
  id: 123456789,
  status: "approved",
  external_reference: "mock_order_id",
});

vi.mock("mercadopago", () => {
  return {
    MercadoPagoConfig: class MercadoPagoConfig {},
    Preference: class Preference {
      create = mockPreferenceCreate;
    },
    Payment: class Payment {
      get = mockPaymentGet;
    },
  };
});

// Mock getCurrentCompanyId and assertRole to bypass auth in actions
vi.mock("@/app/_lib/get-current-company", () => ({
  getCurrentCompanyId: vi.fn(() => "test-company"),
}));
vi.mock("@/app/_lib/rbac", () => ({
  assertRole: vi.fn(),
  assertCapability: vi.fn(),
}));
// We also need to mock Next.js cache and headers if used in actions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock safe-action to unwrap Action errors nicely
vi.mock("next-safe-action", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  return {
    ...actual,
  };
});

import { generateMercadoPagoCheckout } from "@/app/_actions/integration/generate-mercadopago-checkout";
import { POST } from "@/app/api/webhooks/mercadopago/route";
import { setTestDb, cleanDatabase, createSaleTestFixture } from "../helpers/test-db";
import { OrderStatus, SaleStatus } from "@prisma/client";

describe("Mercado Pago Integration", () => {
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
    vi.clearAllMocks();
  });

  // ============================================================
  // Test 1: Checkout Generation fails without credentials
  // ============================================================
  it("should fail to generate checkout if no credentials are set", async () => {
    const { company } = await createSaleTestFixture();

    const result = await generateMercadoPagoCheckout({
      companyId: company.id,
      orderIds: ["fake-order-id"],
    });

    expect(result?.serverError).toContain("O lojista não possui a integração Mercado Pago ativada no momento.");
  });

  // ============================================================
  // Test 2: Checkout Generation succeeds and passes tips properly
  // ============================================================
  it("should successfully generate checkout for an order with items and 10% tip", async () => {
    const { company, user, hamburguer } = await createSaleTestFixture();

    // 1. Setup Integration for company
    await testDb.companyIntegration.create({
      data: {
        companyId: company.id,
        provider: "MERCADOPAGO",
        isEnabled: true,
        credentials: { accessToken: "TEST_TOKEN" },
      },
    });

    // 2. Create Order with 10% tax enabled
    const order = await testDb.order.create({
      data: {
        companyId: company.id,
        status: OrderStatus.PENDING,
        orderNumber: 101,
        hasServiceTax: true,
        totalAmount: 11.00, // 10.00 base + 1.00 tip
      },
    });

    await testDb.orderItem.create({
      data: {
        orderId: order.id,
        productId: hamburguer.id,
        quantity: 1,
        unitPrice: 10.00,
      }
    });

    // 3. Call checkout generation
    const result = await generateMercadoPagoCheckout({
      companyId: company.id,
      orderIds: [order.id],
    });

    expect(result?.data).toBeDefined();
    expect(result?.data?.url).toBe("https://sandbox.mercadopago.com.br/checkout/mock");

    // Ensure SDK was called with correct structure
    expect(mockPreferenceCreate).toHaveBeenCalledOnce();
    const callArgs = mockPreferenceCreate.mock.calls[0][0];

    expect(callArgs.body.external_reference).toBe(order.id);
    expect(callArgs.body.items).toHaveLength(1); // One unified item for the whole order

    const orderItem = callArgs.body.items[0];
    expect(orderItem).toBeDefined();
    expect(orderItem.unit_price).toBe(11.00); // 10.00 base + 1.00 tip
    expect(orderItem.quantity).toBe(1);
  });

  // ============================================================
  // Test 3: Webhook processing succeeds and creates sale with tips
  // ============================================================
  it("should process webhook and convert order to sale with correct tip calculation", async () => {
    const { company, hamburguer } = await createSaleTestFixture();

    // 1. Setup Integration for company
    await testDb.companyIntegration.create({
      data: {
        companyId: company.id,
        provider: "MERCADOPAGO",
        isEnabled: true,
        credentials: { accessToken: "TEST_TOKEN" },
      },
    });

    // Create Order with 10% tax enabled
    const order = await testDb.order.create({
      data: {
        companyId: company.id,
        status: OrderStatus.PENDING,
        orderNumber: 102,
        hasServiceTax: true,
        totalAmount: 22.00, // 20.00 base + 2.00 tip
      },
    });

    await testDb.orderItem.create({
      data: {
        orderId: order.id,
        productId: hamburguer.id,
        quantity: 2,
        unitPrice: 10.00,
      }
    });

    // Mock Payment endpoint to return this order's ID
    mockPaymentGet.mockResolvedValueOnce({
      id: 99999,
      status: "approved",
      external_reference: order.id, // The webhook uses this to find the order
    });

    // Build mock request simulating Mercado Pago webhook payload
    const mockRequest = new Request(`http://localhost/api/webhooks/mercadopago?companyId=${company.id}`, {
      method: "POST",
      body: JSON.stringify({
        type: "payment",
        topic: "payment",
        data: {
          id: "99999"
        }
      })
    });

    // Call POST handler
    const response = await POST(mockRequest as any);
    expect(response.status).toBe(200);

    // Verify order status
    const updatedOrder = await testDb.order.findUnique({ where: { id: order.id } });
    expect(updatedOrder?.status).toBe(OrderStatus.PAID);

    // Verify Sale was created
    const sales = await testDb.sale.findMany({ where: { companyId: company.id } });
    expect(sales).toHaveLength(1);
    expect(sales[0].status).toBe(SaleStatus.ACTIVE);
    expect(Number(sales[0].totalAmount)).toBe(22.00);
    expect(Number(sales[0].tipAmount)).toBe(2.00); // 10% tip calculated by webhook
  });
});
