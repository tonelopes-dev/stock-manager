"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { AuditService } from "@/app/_services/audit";
import { InvitationService } from "@/app/_services/invitation.service";
import { AuditEventType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { inviteUserSchema } from "./schema";

export const inviteUser = actionClient
  .schema(inviteUserSchema)
  .action(async ({ parsedInput: { email, role } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId: inviterId } = await assertRole(ADMIN_AND_OWNER);

    // 1. Verificar se usuário já é membro
    const existingMember = await db.userCompany.findFirst({
      where: {
        companyId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new Error("Usuário já é membro da empresa.");
    }

    // 2. Criar convite via Serviço (Geração de Token e Expiração centralizada)
    const invitation = await InvitationService.createInvitation({
      email,
      role,
      companyId,
      inviterId,
    });

    // 3. Enviar E-mail via Serviço (Centralizado)
    await InvitationService.sendInvitationEmail(invitation.id);

    // 4. Log Audit
    await AuditService.log({
      type: AuditEventType.MEMBER_INVITED,
      companyId,
      entityType: "TEAM_MEMBER",
      metadata: { email, role },
    });

    revalidatePath("/settings/team");
    return { success: true };
  });
