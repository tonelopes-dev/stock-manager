
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

// Mock auth session
const mockSession = {
  user: {
    id: "test-user-id",
    companyId: "test-company-id",
  }
};

vi.mock("@/app/_lib/auth", () => ({
  auth: vi.fn(async () => mockSession),
}));

vi.mock("@/app/_lib/get-current-company", () => ({
  getCurrentCompanyId: vi.fn(async () => "test-company-id"),
}));

import { cleanDatabase, setTestDb } from "../helpers/test-db";
// @ts-ignore - assertCapability doesn't exist yet
import { assertCapability } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";

describe("RBAC — Granular Capabilities", () => {
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
    mockSession.user.id = "test-user-id";
  });

  it("should allow OWNER to perform any action regardless of permissions array", async () => {
    // 1. Setup Company and OWNER user
    const company = await testDb.company.create({
      data: { id: "test-company-id", name: "Test Co", slug: "test-co" }
    });
    const user = await testDb.user.create({
      data: { id: "test-user-id", email: "owner@test.com", name: "Owner" }
    });
    await testDb.userCompany.create({
      data: { userId: user.id, companyId: company.id, role: UserRole.OWNER, permissions: [] }
    });

    // 2. Assert capability (should not throw)
    await expect(assertCapability("ANY_PERMISSION")).resolves.not.toThrow();
  });

  it("should allow MEMBER with specific permission to perform action", async () => {
    // 1. Setup Company and MEMBER user with 'PRODUCT_CREATE' permission
    const company = await testDb.company.create({
      data: { id: "test-company-id", name: "Test Co", slug: "test-co" }
    });
    const user = await testDb.user.create({
      data: { id: "test-user-id", email: "member@test.com", name: "Member" }
    });
    await testDb.userCompany.create({
      data: { 
        userId: user.id, 
        companyId: company.id, 
        role: UserRole.MEMBER, 
        permissions: ["PRODUCT_CREATE"] 
      }
    });

    // 2. Assert capability (should not throw)
    await expect(assertCapability("PRODUCT_CREATE")).resolves.not.toThrow();
  });

  it("should block MEMBER without specific permission", async () => {
    // 1. Setup Company and MEMBER user with empty permissions
    const company = await testDb.company.create({
      data: { id: "test-company-id", name: "Test Co", slug: "test-co" }
    });
    const user = await testDb.user.create({
      data: { id: "test-user-id", email: "member-no-perms@test.com", name: "Member No Perms" }
    });
    await testDb.userCompany.create({
      data: { 
        userId: user.id, 
        companyId: company.id, 
        role: UserRole.MEMBER, 
        permissions: [] 
      }
    });

    // 2. Assert capability (should throw)
    await expect(assertCapability("PRODUCT_CREATE")).rejects.toThrow("Ação não permitida: nível de permissão insuficiente.");
  });

  it("should block ADMIN if permission is missing from their array", async () => {
      const company = await testDb.company.create({
        data: { id: "test-company-id", name: "Test Co", slug: "test-co" }
      });
      const user = await testDb.user.create({
        data: { id: "test-user-id", email: "admin@test.com", name: "Admin" }
      });
      await testDb.userCompany.create({
        data: { 
          userId: user.id, 
          companyId: company.id, 
          role: UserRole.ADMIN, 
          permissions: ["VIEW_SALES"] 
        }
      });
  
      // Should throw if checking for something they don't have
      await expect(assertCapability("DELETE_COMPANY")).rejects.toThrow("Ação não permitida: nível de permissão insuficiente.");
    });
});
