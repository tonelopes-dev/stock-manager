import { auth } from "./auth";
import { db } from "./prisma";
import { UserRole } from "@prisma/client";
import { getCurrentCompanyId } from "./get-current-company";

/**
 * Retorna o papel e as permissões do usuário logado na empresa atual.
 */
export async function getCurrentUserAuth() {
  const session = await auth();
  const companyId = await getCurrentCompanyId();
  
  if (!session?.user?.id || !companyId) return null;

  const userCompany = await db.userCompany.findUnique({
    where: {
      userId_companyId: {
        userId: session.user.id,
        companyId,
      },
    },
    select: { role: true, permissions: true },
  });

  return userCompany ? { 
    role: userCompany.role, 
    permissions: userCompany.permissions,
    userId: session.user.id,
    companyId
  } : null;
}

/**
 * Legado: Retorna apenas o papel.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const authData = await getCurrentUserAuth();
  return authData?.role || null;
}

/**
 * Garante que o usuário tem um dos papéis permitidos.
 * (Camada de Proteção de Server Actions)
 */
export async function assertRole(allowedRoles: UserRole[]) {
  const authData = await getCurrentUserAuth();
  
  if (!authData || !allowedRoles.includes(authData.role)) {
    throw new Error("Ação não permitida: nível de permissão insuficiente.");
  }
  
  return { role: authData.role, userId: authData.userId };
}

/**
 * Garante que o usuário tem uma permissão específica (Capability).
 * Se o usuário for OWNER, ele tem permissão total automaticamente.
 */
export async function assertCapability(permission: string) {
  const authData = await getCurrentUserAuth();

  if (!authData) {
    throw new Error("Não autenticado.");
  }

  // 1. Superuser Check (OWNER pode tudo)
  if (authData.role === UserRole.OWNER) {
    return authData;
  }

  // 2. Granular Check
  if (!authData.permissions.includes(permission)) {
    throw new Error("Ação não permitida: nível de permissão insuficiente.");
  }

  return authData;
}

// Helpers rápidos para legibilidade
export const OWNER_ONLY = [UserRole.OWNER];
export const ADMIN_AND_OWNER = [UserRole.OWNER, UserRole.ADMIN];
export const ALL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER];

