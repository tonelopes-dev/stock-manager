import { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { getCurrentCompanyId } from "./get-current-company";
import { db } from "./prisma";

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
 *
 * ⚠️  Uso: em Server Actions — lança erro capturado pelo handleServerError
 *           do safe-action e retornado como { serverError } para o cliente.
 */
export async function assertCapability(permission: string) {
  const authData = await getCurrentUserAuth();

  if (!authData) {
    throw new Error("Não autenticado.");
  }

  // OWNER tem bypass total
  if (authData.role === UserRole.OWNER) {
    return authData;
  }

  // Verificação granular
  if (!authData.permissions.includes(permission)) {
    console.warn(`[RBAC] Unauthorized action attempt: permission="${permission}" userId="${authData.userId}"`);
    throw new Error("Acesso negado: você não tem permissão para realizar esta ação.");
  }

  return authData;
}

/**
 * Alias semântico de assertCapability para uso explícito em Server Actions.
 *
 * Mesma implementação — o nome diferente serve como sinal de leitura:
 * - assertActionCapability → dentro de Server Actions
 * - assertPageCapability   → dentro de Server Component pages/layouts (usa redirect)
 *
 * Em caso de acesso negado: lança Error → capturado pelo safe-action como serverError.
 * NÃO faz redirect (comportamento correto para actions: o cliente trata o erro).
 */
export const assertActionCapability = assertCapability;

// Helpers rápidos para legibilidade
export const OWNER_ONLY = [UserRole.OWNER];
export const ADMIN_AND_OWNER = [UserRole.OWNER, UserRole.ADMIN];
export const ALL_ROLES = [UserRole.OWNER, UserRole.ADMIN, UserRole.MEMBER];

/**
 * Variante de assertCapability para uso em Server Component pages/layouts.
 * Em vez de lançar um erro (que causaria um ErrorBoundary), faz redirect
 * para /nao-autorizado quando a permissão é negada.
 *
 * OWNER sempre passa — sem consulta adicional ao banco.
 *
 * @param permission - A capability exigida (ex: PERMISSIONS.BILLING_VIEW)
 */
export async function assertPageCapability(permission: string) {
  const authData = await getCurrentUserAuth();

  if (!authData) {
    redirect("/login");
  }

  // OWNER tem acesso total — bypass imediato
  if (authData.role === UserRole.OWNER) {
    return authData;
  }

  // Verifica permissão granular
  if (!authData.permissions.includes(permission)) {
    redirect("/nao-autorizado");
  }

  return authData;
}
