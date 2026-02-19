import { auth } from "./auth";
import { db } from "./prisma";
import { UserRole } from "@prisma/client";
import { getCurrentCompanyId } from "./get-current-company";

/**
 * Retorna o papel do usuário logado na empresa atual.
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
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
    select: { role: true },
  });

  return userCompany?.role || null;
}

/**
 * Garante que o usuário tem um dos papéis permitidos.
 * Lança erro se não autorizado. (Camada de Proteção de Server Actions)
 */
export async function assertRole(allowedRoles: UserRole[]) {
  const role = await getCurrentUserRole();
  
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Ação não permitida: nível de permissão insuficiente.");
  }
  
  return role;
}

// Helpers rápidos para legibilidade
export const OWNER_ONLY = [UserRole.OWNER];
export const ADMIN_AND_OWNER = [UserRole.OWNER, UserRole.ADMIN];
export const ALL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER];

