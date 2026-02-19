"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";
import { UserRole } from "@prisma/client";

const updateMemberRoleSchema = z.object({
  userCompanyId: z.string(),
  newRole: z.nativeEnum(UserRole),
});

export const updateMemberRole = actionClient
  .schema(updateMemberRoleSchema)
  .action(async ({ parsedInput: { userCompanyId, newRole } }) => {
    const companyId = await getCurrentCompanyId();
    
    // Layer 2: Action Guard (Only OWNER can change roles)
    await assertRole(OWNER_ONLY);

    const memberToUpdate = await db.userCompany.findUnique({
      where: { id: userCompanyId, companyId },
      select: { role: true, userId: true },
    });

    if (!memberToUpdate) {
      throw new Error("Membro não encontrado.");
    }

    // Business Logic: If demoting an OWNER, ensure it's not the last one
    if (memberToUpdate.role === UserRole.OWNER && newRole !== UserRole.OWNER) {
       const ownerCount = await db.userCompany.count({
        where: { companyId, role: UserRole.OWNER },
      });

      if (ownerCount <= 1) {
        throw new Error("A empresa deve ter pelo menos um proprietário.");
      }
    }

    await db.userCompany.update({
      where: { id: userCompanyId },
      data: { role: newRole },
    });

    revalidatePath("/settings/team");
    
    return { success: true };
  });
