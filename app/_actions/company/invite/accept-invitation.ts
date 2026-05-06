
"use server";

import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { acceptInviteSchema } from "./schema";
import { InvitationService } from "@/app/_services/invitation.service";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";

/**
 * 🛡️ SERVER ACTION: Aceite de Convite Externo
 * Responsável por processar o formulário da página pública /invite/accept.
 */
export const acceptInviteAction = actionClient
  .schema(acceptInviteSchema)
  .action(async ({ parsedInput: { token, password } }) => {
    // 1. Validar Token via Serviço
    const invitation = await InvitationService.validateToken(token);

    return await db.$transaction(async (trx) => {
      // 2. Verificar se o Usuário já existe
      let user = await trx.user.findUnique({
        where: { email: invitation.email },
      });

      if (!user) {
        // 3. Se não existe, cria com a senha hasheada
        const hashedPassword = await hash(password, 12);
        user = await trx.user.create({
          data: {
            email: invitation.email,
            password: hashedPassword,
            name: invitation.email.split("@")[0], // Fallback name
          },
        });
      }

      // 4. Verificar se já é membro (prevenção de duplicidade)
      const existingMember = await trx.userCompany.findUnique({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: invitation.companyId,
          },
        },
      });

      if (existingMember) {
        throw new Error("Você já faz parte desta empresa.");
      }

      // 5. Vinculação Híbrida (Role + Permissions)
      await trx.userCompany.create({
        data: {
          userId: user.id,
          companyId: invitation.companyId,
          role: invitation.role,
          permissions: invitation.permissions,
        },
      });

      // 6. Invalidação do Token (Lei Zero Trust)
      await trx.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      revalidatePath("/");
      return { success: true };
    });
  });
