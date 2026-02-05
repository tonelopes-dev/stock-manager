import { auth } from "./auth";
import { db } from "./prisma";
import { UserRole } from "@prisma/client";
import { getCurrentCompanyId } from "./get-current-company";

export async function getUserRoleInCompany(companyId?: string): Promise<UserRole | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const targetCompanyId = companyId || await getCurrentCompanyId();

  const userCompany = await db.userCompany.findUnique({
    where: {
      userId_companyId: {
        userId: session.user.id,
        companyId: targetCompanyId,
      },
    },
    select: { role: true },
  });

  return userCompany?.role || null;
}

export async function isUserAuthorized(
  allowedRoles: UserRole[],
  companyId?: string
): Promise<boolean> {
  const role = await getUserRoleInCompany(companyId);
  if (!role) return false;
  return allowedRoles.includes(role);
}

export async function authorizeAction(
  allowedRoles: UserRole[],
  companyId?: string
) {
  const authorized = await isUserAuthorized(allowedRoles, companyId);
  if (!authorized) {
    throw new Error("Não autorizado: permissão insuficiente.");
  }
}

export const isAdminOrOwner = () => authorizeAction([UserRole.ADMIN, UserRole.OWNER]);
export const isOwner = () => authorizeAction([UserRole.OWNER]);
