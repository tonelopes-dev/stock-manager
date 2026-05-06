
"use server";

import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, assertCapability, ADMIN_AND_OWNER } from "@/app/_lib/rbac";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { revalidatePath } from "next/cache";

const updateMemberSchema = z.object({
  userCompanyId: z.string(), // ID da relação UserCompany
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()),
});

/**
 * 🛠️ SERVER ACTION: Atualizar Membro da Equipe
 * Permite alterar o papel e as capacidades granulares de um colaborador.
 */
export const updateMemberAction = actionClient
  .schema(updateMemberSchema)
  .action(async ({ parsedInput: { userCompanyId, role, permissions } }) => {
    const companyId = await getCurrentCompanyId();
    
    // 1. Verificação de Permissão (Lei Zero Trust)
    // Precisa ser OWNER ou ter a capacidade TEAM_MANAGE
    try {
        await assertCapability(PERMISSIONS.TEAM_MANAGE);
    } catch {
        await assertRole(ADMIN_AND_OWNER);
    }

    // 2. Buscar membro atual para validações
    const currentMember = await db.userCompany.findUnique({
      where: { id: userCompanyId },
    });

    if (!currentMember || currentMember.companyId !== companyId) {
      throw new Error("Membro não encontrado nesta empresa.");
    }

    // 3. REGRA DE OURO: Não pode alterar o OWNER
    if (currentMember.role === UserRole.OWNER) {
      throw new Error("Não é possível alterar as permissões do proprietário da empresa.");
    }

    // 4. Executar Atualização
    await db.userCompany.update({
      where: { id: userCompanyId },
      data: {
        role,
        permissions,
      },
    });

    revalidatePath("/settings/team");
    
    return { success: true };
  });
