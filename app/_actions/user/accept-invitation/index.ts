"use server";

import { db } from "@/app/_lib/prisma";
import { auth } from "@/app/_lib/auth";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";

const acceptInvitationSchema = z.object({
  invitationId: z.string(),
});

export const acceptInvitation = actionClient
  .schema(acceptInvitationSchema)
  .action(async ({ parsedInput: { invitationId } }) => {
    const session = await auth();

    if (!session?.user?.id) {
      throw new Error("Você precisa estar logado para aceitar um convite.");
    }

    const invitation = await db.companyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.status !== "PENDING") {
      throw new Error("Convite inválido ou já expirado.");
    }

    // O e-mail do convite deve bater com o e-mail do usuário logado (opcional mas recomendado)
    // if (invitation.email !== session.user.email) {
    //   throw new Error("Este convite foi enviado para um e-mail diferente.");
    // }

    await db.$transaction(async (trx) => {
      // 1. Criar o vínculo UserCompany
      await trx.userCompany.create({
        data: {
          userId: session.user.id,
          companyId: invitation.companyId,
          role: invitation.role,
        },
      });

      // 2. Marcar convite como aceito
      await trx.companyInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });
    });

    revalidatePath("/", "layout");
    return { success: true };
  });
