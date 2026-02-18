"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { getTeamUsage } from "@/app/_data-access/user/get-team-usage";
import { revalidatePath } from "next/cache";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";

const inviteMemberSchema = z.object({
  email: z.string().email("E-mail inválido"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export const inviteMember = actionClient
  .schema(inviteMemberSchema)
  .action(async ({ parsedInput: { email, role } }) => {
    const session = await auth();
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);

    if (!session?.user?.id) {
      throw new Error("Não autorizado");
    }

    // 1. Verificar se o usuário atual é ADMIN ou OWNER
    const currentUserRole = await db.userCompany.findUnique({
        where: { userId_companyId: { userId: session.user.id, companyId } },
        select: { role: true }
    });

    if (!currentUserRole || (currentUserRole.role !== "OWNER" && currentUserRole.role !== "ADMIN")) {
        throw new Error("Apenas administradores podem convidar membros.");
    }

    // 2. Verificar limites do plano
    const { userCount, maxUsers } = await getTeamUsage();
    if (userCount >= maxUsers) {
        throw new Error(`Limite de usuários atingido (${maxUsers}). Faça upgrade do seu plano.`);
    }

    // 3. Verificar se o e-mail já é membro ou já foi convidado
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

    revalidatePath("/settings/team");
    return { success: true };
  });
