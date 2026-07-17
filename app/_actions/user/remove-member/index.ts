"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { db } from "@/app/_lib/prisma";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, AuditSeverity, UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";



const removeMemberSchema = z.object({
  userCompanyId: z.string(),
});

export const removeMember = actionClient
  .schema(removeMemberSchema)
  .action(async ({ parsedInput: { userCompanyId } }) => {
    const companyId = await getCurrentCompanyId();
    // Guard: OWNER bypass | requer TEAM_MANAGE
    const { role: requesterRole } = await assertActionCapability(PERMISSIONS.TEAM_MANAGE);

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

    // 3. Log Audit
    await AuditService.log({
      type: AuditEventType.MEMBER_REMOVED,
      severity: AuditSeverity.WARNING,
      companyId,
      entityType: "TEAM_MEMBER",
      entityId: memberToDelete.userId,
      metadata: { 
        removedUserId: memberToDelete.userId,
        role: memberToDelete.role 
      },
    });


    revalidatePath("/settings/team");
    
    return { success: true };
  });
