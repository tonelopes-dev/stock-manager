"use server";

import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, OWNER_ONLY } from "@/app/_lib/rbac";
import { UserRole, AuditEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { AuditService } from "@/app/_services/audit";
import { AuditSeverity } from "@prisma/client";

const transferOwnershipSchema = z.object({
  newOwnerId: z.string().min(1, "O novo proprietário é obrigatório"),
});

export const transferOwnership = actionClient
  .schema(transferOwnershipSchema)
  .action(async ({ parsedInput: { newOwnerId } }) => {
    const { role: requesterRole, userId: currentOwnerId } = await assertRole(OWNER_ONLY);
    const companyId = await getCurrentCompanyId();

    if (newOwnerId === currentOwnerId) {
      throw new Error("Você já é o proprietário desta empresa.");
    }

    try {
      return await db.$transaction(async (tx) => {
        // 1. Verify target is an ADMIN in the same company
        const targetMember = await tx.userCompany.findUnique({
          where: {
            userId_companyId: {
              userId: newOwnerId,
              companyId,
            },
          },
        });

        if (!targetMember || targetMember.role !== UserRole.ADMIN) {
          throw new Error("O novo proprietário deve ser um Administrador da mesma empresa.");
        }

        // 2. Promote target to OWNER
        await tx.userCompany.update({
          where: { id: targetMember.id },
          data: { role: UserRole.OWNER },
        });

        // 3. Demote current owner to ADMIN
        const currentMember = await tx.userCompany.findUnique({
          where: {
            userId_companyId: {
              userId: currentOwnerId,
              companyId,
            },
          },
        });

        if (currentMember) {
          await tx.userCompany.update({
            where: { id: currentMember.id },
            data: { role: UserRole.ADMIN },
          });
        }

        // 4. Invalidate sessions by incrementing sessionVersion
        await tx.user.updateMany({
          where: {
            id: { in: [currentOwnerId, newOwnerId] },
          },
          data: {
            sessionVersion: { increment: 1 },
          },
        });

        // 5. Log Audit Event
        await AuditService.logWithTransaction(tx, {
          type: AuditEventType.OWNERSHIP_TRANSFERRED,
          severity: AuditSeverity.WARNING,
          companyId,
          entityType: "COMPANY",
          entityId: companyId,
          metadata: {
            fromOwnerId: currentOwnerId,
            toOwnerId: newOwnerId,
          },
        });

        revalidatePath("/(protected)/settings/team");
        revalidatePath("/(protected)/settings/company");

        return { success: true };
      });
    } catch (error: any) {
      console.error("Transfer Ownership Error:", error);
      throw new Error(error.message || "Erro ao transferir posse.");
    }
  });
