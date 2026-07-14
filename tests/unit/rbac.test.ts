import { describe, it, expect, vi, beforeEach } from "vitest";
import { hasCapability, PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";
import { auth } from "@/app/_lib/auth";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";

// Mock das dependências internas do getCurrentUserAuth
vi.mock("@/app/_lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/app/_lib/get-current-company", () => ({
  getCurrentCompanyId: vi.fn(),
}));

vi.mock("@/app/_lib/prisma", () => ({
  db: {
    userCompany: {
      findUnique: vi.fn(),
    },
  },
}));

describe("RBAC and Permissions - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("hasCapability (Sync Utility)", () => {
    it("should return true for UserRole.OWNER regardless of permissions array", () => {
      // Mesmo sem nenhuma permissão listada, o OWNER deve passar
      const result1 = hasCapability([], UserRole.OWNER, PERMISSIONS.BILLING_VIEW);
      expect(result1).toBe(true);

      const result2 = hasCapability(["some:other:permission"], UserRole.OWNER, PERMISSIONS.COMPANY_SETTINGS_UPDATE);
      expect(result2).toBe(true);
    });

    it("should return true for ADMIN or MEMBER only if exact permission exists", () => {
      // ADMIN com a permissão
      const adminResult = hasCapability([PERMISSIONS.REPORTS_VIEW], UserRole.ADMIN, PERMISSIONS.REPORTS_VIEW);
      expect(adminResult).toBe(true);

      // MEMBER com a permissão
      const memberResult = hasCapability([PERMISSIONS.SALE_CREATE, PERMISSIONS.SALE_CANCEL], UserRole.MEMBER, PERMISSIONS.SALE_CANCEL);
      expect(memberResult).toBe(true);
    });

    it("should return false when the required permission is not in the array (for non-OWNER)", () => {
      // ADMIN sem a permissão
      const adminResult = hasCapability([PERMISSIONS.REPORTS_VIEW], UserRole.ADMIN, PERMISSIONS.BILLING_VIEW);
      expect(adminResult).toBe(false);

      // MEMBER sem permissão
      const memberResult = hasCapability([], UserRole.MEMBER, PERMISSIONS.SALE_CREATE);
      expect(memberResult).toBe(false);
    });
  });

  describe("assertActionCapability (Server Action Guard)", () => {
    // Helper para configurar o mock de DB e Auth
    const setupAuthMock = (role: UserRole, permissions: string[]) => {
      vi.mocked(auth).mockResolvedValue({ user: { id: "user-123" } } as any);
      vi.mocked(getCurrentCompanyId).mockResolvedValue("comp-123");
      vi.mocked(db.userCompany.findUnique).mockResolvedValue({
        role,
        permissions,
      } as any);
    };

    it("should throw an Error when user is not OWNER and lacks permission", async () => {
      // Mock configurado como MEMBER sem a permissão necessária
      setupAuthMock(UserRole.MEMBER, [PERMISSIONS.SALE_VIEW]);

      // Tentando acessar algo que exige TEAM_MANAGE
      await expect(
        assertActionCapability(PERMISSIONS.TEAM_MANAGE)
      ).rejects.toThrow("Acesso negado: você não tem permissão para realizar esta ação.");
    });

    it("should not throw when user is OWNER (bypass)", async () => {
      // Mock configurado como OWNER sem a permissão no array
      setupAuthMock(UserRole.OWNER, []);

      // Tentando acessar algo, não deve dar throw
      await expect(
        assertActionCapability(PERMISSIONS.COMPANY_SETTINGS_UPDATE)
      ).resolves.not.toThrow();
      
      // Valida se retornou os dados de auth corretamente
      const result = await assertActionCapability(PERMISSIONS.COMPANY_SETTINGS_UPDATE);
      expect(result).toMatchObject({
        role: UserRole.OWNER,
        userId: "user-123",
        companyId: "comp-123"
      });
    });

    it("should not throw when user is ADMIN/MEMBER but has the exact permission", async () => {
      // Mock configurado como MEMBER com a permissão
      setupAuthMock(UserRole.MEMBER, [PERMISSIONS.SALE_CREATE]);

      await expect(
        assertActionCapability(PERMISSIONS.SALE_CREATE)
      ).resolves.not.toThrow();
      
      const result = await assertActionCapability(PERMISSIONS.SALE_CREATE);
      expect(result).toMatchObject({
        role: UserRole.MEMBER,
        userId: "user-123",
        companyId: "comp-123"
      });
    });
    
    it("should throw an Error when not authenticated (no session)", async () => {
      vi.mocked(auth).mockResolvedValue(null);
      vi.mocked(getCurrentCompanyId).mockResolvedValue("comp-123");
      
      await expect(
        assertActionCapability(PERMISSIONS.SALE_CREATE)
      ).rejects.toThrow("Não autenticado.");
    });
  });
});
