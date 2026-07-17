
"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { db } from "@/app/_lib/prisma";
import { ADMIN_AND_OWNER, assertCapability, assertRole } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const updateMemberSchema = z.object({
  userCompanyId: z.string(), // ID da relação UserCompany
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()),
  avatarUrl: z.string().optional(),
});

/**
 * 🛠️ SERVER ACTION: Atualizar Membro da Equipe
 * Permite alterar o papel, as capacidades granulares e a foto de um colaborador.
 */
export const updateMemberAction = actionClient
  .schema(updateMemberSchema)
  .action(async ({ parsedInput: { userCompanyId, role, permissions, avatarUrl } }) => {
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

    // 4. Executar Atualização em Transação
    await db.$transaction(async (trx) => {
        // Atualizar Role e Permissões no Elo UserCompany
        await trx.userCompany.update({
            where: { id: userCompanyId },
            data: {
                role,
                permissions,
            },
        });

        // Atualizar Avatar no User (se fornecido)
        if (avatarUrl !== undefined) {
            await trx.user.update({
                where: { id: currentMember.userId },
                data: { avatarUrl },
            });
        }
    });

    revalidatePath("/settings/team");
    
    return { success: true };
  });
