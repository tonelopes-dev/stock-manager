import { auth } from "./auth";
import { db } from "./prisma";
import { UserRole } from "@prisma/client";

export async function getUserRoleInCompany(companyId: string): Promise<UserRole | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

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

export async function isUserAuthorized(
  companyId: string,
  allowedRoles: UserRole[]
): Promise<boolean> {
  const role = await getUserRoleInCompany(companyId);
  if (!role) return false;
  return allowedRoles.includes(role);
}

export async function authorizeAction(
  companyId: string,
  allowedRoles: UserRole[]
) {
  const authorized = await isUserAuthorized(companyId, allowedRoles);
  if (!authorized) {
    throw new Error("Não autorizado: permissão insuficiente.");
  }
}
