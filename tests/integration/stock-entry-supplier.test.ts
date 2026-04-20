import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { db } from "@/app/_lib/prisma";
import { cleanDatabase, setupTestDb } from "../helpers/test-db";
import { createStockEntry } from "@/app/_actions/stock-entry/create-stock-entry";

describe("Stock Entry — Supplier ID Handling", () => {
  let testData: any;

  beforeEach(async () => {
    await cleanDatabase();
    testData = await setupTestDb();
  });

  afterEach(async () => {
    await cleanDatabase();
  });

  it("should successfully create a stock entry with an empty string supplierId (transformed to null)", async () => {
    // We call the action directly with an empty string for supplierId
    // This simulates the form sending ""
    const result = await createStockEntry({
      productId: testData.ingredients[0].id,
      supplierId: "", // This should be transformed to null by Zod
      quantity: 10,
      unitCost: 5,
      date: new Date(),
    });

    expect(result?.data).toBeDefined();
    
    // Verify in database
    const entry = await db.stockEntry.findFirst({
        where: { productId: testData.ingredients[0].id }
    });
    
    expect(entry).not.toBeNull();
    expect(entry?.supplierId).toBeNull();
    expect(Number(entry?.quantity)).toBe(10);
  });

  it("should successfully create a stock entry with a valid supplierId", async () => {
    const result = await createStockEntry({
      productId: testData.ingredients[0].id,
      supplierId: testData.suppliers[0].id,
      quantity: 5,
      unitCost: 10,
      date: new Date(),
    });

    expect(result?.data).toBeDefined();
    
    const entry = await db.stockEntry.findFirst({
        where: { quantity: 5 }
    });
    
    expect(entry?.supplierId).toBe(testData.suppliers[0].id);
  });
});
