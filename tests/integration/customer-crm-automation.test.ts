import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from "vitest";
import { POST } from "@/app/api/customers/register/route";
import { setTestDb, cleanDatabase } from "../helpers/test-db";

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

describe("Customer CRM Automation Integration Tests", () => {
  let company: any;

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
    company = await testDb.company.create({
      data: {
        id: "company-test-crm",
        name: "Test Company CRM",
        slug: "test-company-crm",
      },
    });
  });

  it("should create a new customer with 'Cardápio Digital' category and stage", async () => {
    const payload = {
      name: "New Customer",
      phoneNumber: "11999998888",
      companyId: company.id,
    };

    const request = new Request("http://localhost/api/customers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);

    const customer = await testDb.customer.findUnique({
      where: { id: data.customer.customerId },
      include: {
        categories: true,
        stage: true,
      },
    });

    expect(customer?.name).toBe("New Customer");
    expect(customer?.categories[0].name).toBe("Cardápio Digital");
    expect(customer?.stage?.name).toBe("Cardápio Digital");
    expect(customer?.stage?.order).toBe(0);
    expect(customer?.position).toBe(0);
  });

  it("should ensure 'Cardápio Digital' stage is the first column (order 0)", async () => {
    // Create an existing stage
    await testDb.cRMStage.create({
      data: { name: "Existing Stage", order: 0, companyId: company.id },
    });

    const payload = {
      name: "Another Customer",
      phoneNumber: "11988887777",
      companyId: company.id,
    };

    const request = new Request("http://localhost/api/customers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    await POST(request);

    const stages = await testDb.cRMStage.findMany({
      where: { companyId: company.id },
      orderBy: { order: "asc" },
    });

    expect(stages[0].name).toBe("Cardápio Digital");
    expect(stages[0].order).toBe(0);
    expect(stages[1].name).toBe("Existing Stage");
    expect(stages[1].order).toBe(1);
  });

  it("should NOT change stage for existing customers", async () => {
    // 1. Create a stage and a customer manually in that stage
    const otherStage = await testDb.cRMStage.create({
      data: { name: "Finished", order: 5, companyId: company.id },
    });

    const existingCustomer = await testDb.customer.create({
      data: {
        name: "Existing Joe",
        phone: "11777776666",
        companyId: company.id,
        stageId: otherStage.id,
        source: "CRM",
      },
    });

    // 2. Register via Menu
    const payload = {
      name: "Joe Updated Name", // Should be ignored since existing.name exists
      phoneNumber: "11777776666",
      imageUrl: "http://new-photo.com/joe.jpg", // Should be updated
      companyId: company.id,
    };

    const request = new Request("http://localhost/api/customers/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(data.success).toBe(true);

    const customer = await testDb.customer.findUnique({
      where: { id: existingCustomer.id },
    });

    // Should stay in the same stage
    expect(customer?.stageId).toBe(otherStage.id);
    // Should NOT have changed name (as per logic: existing.name || name)
    expect(customer?.name).toBe("Existing Joe");
    // Should have updated imageUrl
    expect(customer?.imageUrl).toBe("http://new-photo.com/joe.jpg");
  });

  it("should place new customers at the top of the column (position 0)", async () => {
    // Register first customer
    await POST(new Request("http://localhost/api/customers/register", {
      method: "POST",
      body: JSON.stringify({ name: "First", phoneNumber: "1", companyId: company.id }),
    }));

    // Register second customer
    await POST(new Request("http://localhost/api/customers/register", {
      method: "POST",
      body: JSON.stringify({ name: "Second", phoneNumber: "2", companyId: company.id }),
    }));

    const customers = await testDb.customer.findMany({
      where: { companyId: company.id },
      orderBy: { position: "asc" },
    });

    expect(customers[0].name).toBe("Second");
    expect(customers[0].position).toBe(0);
    expect(customers[1].name).toBe("First");
    expect(customers[1].position).toBe(1);
  });
});
