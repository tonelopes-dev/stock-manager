"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { db } from "@/app/_lib/prisma";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const inviteMemberSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const inviteMember = actionClient
  .schema(inviteMemberSchema)
  .action(async ({ parsedInput: { email, role } }) => {
    const companyId = await getCurrentCompanyId();
    // Guard: OWNER bypass | requer TEAM_MANAGE
    const { userId } = await assertActionCapability(PERMISSIONS.TEAM_MANAGE);
    await requireActiveSubscription(companyId);

    if (!userId) {
      throw new Error("Não autorizado");
    }

    // 1. Verificar se o e-mail já é membro ou já foi convidado
    const existingMember = await db.userCompany.findFirst({
        where: { companyId, user: { email } }
    });

    if (existingMember) {
        throw new Error("Este usuário já é membro da empresa.");
    }

    const existingInvite = await db.companyInvitation.findFirst({
        where: { companyId, email, status: "PENDING" }
    });

    if (existingInvite) {
        throw new Error("Já existe um convite pendente para este e-mail.");
    }

    // 4. Criar o convite
    await db.companyInvitation.create({
      data: {
        email,
        role,
        companyId,
      },
    });

    // 5. Log Audit
    await AuditService.log({
      type: AuditEventType.MEMBER_INVITED,
      companyId,
      entityType: "TEAM_MEMBER",
      metadata: { email, role },
    });


    revalidatePath("/settings/team");
    return { success: true };
  });
