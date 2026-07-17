
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const { testDb } = vi.hoisted(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } = require("@prisma/client");
  return { testDb: new PrismaClient() };
});

vi.mock("@/app/_lib/prisma", () => ({
  db: testDb,
}));

import { cleanDatabase, setTestDb } from "../helpers/test-db";
// @ts-ignore - InvitationService doesn't exist yet
import { InvitationService } from "@/app/_services/invitation.service";
import { UserRole } from "@prisma/client";

describe("Invitation System — Secure Tokens", () => {
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

  it("should create an invitation with a unique token and expiration", async () => {
    const company = await testDb.company.create({
      data: { name: "Test Co", slug: "test-co" }
    });

    const invitation = await InvitationService.createInvitation({
      email: "new@user.com",
      role: UserRole.MEMBER,
      companyId: company.id,
      permissions: ["KDS_VIEW"]
    });

    expect(invitation.token).toBeDefined();
    expect(invitation.token.length).toBeGreaterThan(10);
    expect(invitation.expiresAt).toBeDefined();
    expect(new Date(invitation.expiresAt!).getTime()).toBeGreaterThan(Date.now());
  });

  it("should validate a valid token", async () => {
    const company = await testDb.company.create({
      data: { name: "Test Co", slug: "test-co" }
    });

    const invitation = await testDb.companyInvitation.create({
      data: {
        email: "valid@user.com",
        companyId: company.id,
        role: UserRole.MEMBER,
        token: "valid-token-123",
        expiresAt: new Date(Date.now() + 1000 * 60 * 60) // 1h from now
      }
    });

    const validated = await InvitationService.validateToken("valid-token-123");
    expect(validated.email).toBe("valid@user.com");
  });

  it("should fail for an expired token", async () => {
    const company = await testDb.company.create({
      data: { name: "Test Co", slug: "test-co" }
    });

    await testDb.companyInvitation.create({
      data: {
        email: "expired@user.com",
        companyId: company.id,
        role: UserRole.MEMBER,
        token: "expired-token",
        expiresAt: new Date(Date.now() - 1000) // 1s ago
      }
    });

    await expect(InvitationService.validateToken("expired-token")).rejects.toThrow("Convite expirado");
  });

  it("should invalidate the token after successful acceptance", async () => {
    const company = await testDb.company.create({
      data: { name: "Test Co", slug: "test-co" }
    });

    const token = "unique-token-to-be-used";
    await testDb.companyInvitation.create({
      data: {
        email: "reuse@user.com",
        companyId: company.id,
        role: UserRole.MEMBER,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60)
      }
    });

    const user = await testDb.user.create({
      data: { email: "reuse@user.com", name: "User" }
    });

    // First use
    await InvitationService.acceptInvitation(token, user.id);
    
    // Second use should fail
    await expect(InvitationService.acceptInvitation(token, user.id)).rejects.toThrow("Este convite já foi processado.");
  });

  it("should link user with correct permissions upon acceptance", async () => {
    const company = await testDb.company.create({
      data: { name: "Test Co", slug: "test-co" }
    });

    const invitation = await testDb.companyInvitation.create({
      data: {
        email: "link@user.com",
        companyId: company.id,
        role: UserRole.MEMBER,
        token: "link-token",
        permissions: ["STOCK_VIEW", "SALE_CREATE"],
        expiresAt: new Date(Date.now() + 10000)
      }
    });

    const user = await testDb.user.create({
      data: { email: "link@user.com", name: "New User" }
    });

    await InvitationService.acceptInvitation("link-token", user.id);

    const userCompany = await testDb.userCompany.findUnique({
      where: { userId_companyId: { userId: user.id, companyId: company.id } }
    });

    expect(userCompany?.role).toBe(UserRole.MEMBER);
    expect(userCompany?.permissions).toContain("STOCK_VIEW");
    expect(userCompany?.permissions).toContain("SALE_CREATE");
  });
});
