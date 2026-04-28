import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/app/_lib/prisma";
import { cleanDatabase, setTestDb, createSaleTestFixture } from "../helpers/test-db";
import { createStockEntry } from "@/app/_actions/stock-entry/create-stock-entry";

describe("Stock Entry — Supplier ID Handling", () => {
  let testData: any;

  beforeEach(async () => {
    setTestDb(db);
    await cleanDatabase();
    testData = await createSaleTestFixture();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("should successfully create a stock entry with an empty string supplierId (transformed to undefined)", async () => {
    // We call the action directly with an empty string for supplierId
    // This simulates the form sending ""
    const result = await createStockEntry({
      productId: testData.pao.id,
      supplierId: "", // This should be transformed to undefined by Zod
      quantity: 10,
      unitCost: 5,
      date: new Date(),
    });

    expect(result?.data).toBeDefined();
    
    // Verify in database
    const entry = await db.stockEntry.findFirst({
        where: { productId: testData.pao.id }
    });
    
    expect(entry).not.toBeNull();
    expect(entry?.supplierId).toBeNull();
    expect(Number(entry?.quantity)).toBe(10);
  });

  it("should successfully create a stock entry with a valid supplierId", async () => {
    // Create a supplier first
    const supplier = await db.supplier.create({
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
    
    const entry = await db.stockEntry.findFirst({
        where: { quantity: 5 }
    });
    
    expect(entry?.supplierId).toBe(supplier.id);
  });
});
