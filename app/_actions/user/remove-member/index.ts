"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, ADMIN_AND_OWNER } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";


const removeMemberSchema = z.object({
  userCompanyId: z.string(),
});

export const removeMember = actionClient
  .schema(removeMemberSchema)
  .action(async ({ parsedInput: { userCompanyId } }) => {
    const companyId = await getCurrentCompanyId();
    const requesterRole = await assertRole(ADMIN_AND_OWNER);

    const memberToDelete = await db.userCompany.findUnique({
      where: { id: userCompanyId, companyId },
      select: { role: true, userId: true },
    });

    if (!memberToDelete) {
      throw new Error("Membro não encontrado nesta empresa.");
    }

    // Business Logic: ADMIN cannot remove OWNER or other ADMIN
    if (requesterRole === UserRole.ADMIN && memberToDelete.role !== UserRole.MEMBER) {
      throw new Error("Administradores só podem remover membros operacionais.");
    }

    // Business Logic: Prevent removing the last owner
    if (memberToDelete.role === UserRole.OWNER) {
      const ownerCount = await db.userCompany.count({
        where: { companyId, role: UserRole.OWNER },
      });
      
      if (ownerCount <= 1) {
        throw new Error("Não é possível remover o único proprietário da empresa. Transfira a propriedade antes.");
      }
    }

    await db.userCompany.delete({
      where: { id: userCompanyId },
    });

    revalidatePath("/settings/team");
    
    return { success: true };
  });
