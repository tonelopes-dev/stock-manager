
"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { UserRole } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { getWhatsAppUrl } from "@/app/_lib/utils";
import { InvitationService } from "@/app/_services/invitation.service";

const inviteSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10), // Required for WhatsApp
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.string()).optional(),
});

/**
 * 🛡️ REATORAÇÃO DE SEGURANÇA (Zero Trust)
 * Anteriormente este arquivo enviava a senha em texto claro via WhatsApp.
 * Agora, ele gera um convite seguro (token) e envia o link de aceite (Magic Link).
 */
export const inviteUserViaWhatsApp = actionClient
  .schema(inviteSchema)
  .action(async ({ parsedInput: { name, email, phone, role, permissions = [] } }) => {
    const session = await auth();
    const companyId = await getCurrentCompanyId();

    if (!session?.user?.id || !companyId) {
      throw new Error("Não autorizado.");
    }

    // 1. Verificar se usuário já existe na empresa
    const existingMember = await db.userCompany.findFirst({
      where: {
        companyId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new Error("Este usuário já faz parte da empresa.");
    }

    // 2. Criar Convite Seguro via Serviço
    const invitation = await InvitationService.createInvitation({
      email,
      role,
      companyId,
      permissions,
      inviterId: session.user.id,
    });

    // 3. Obter dados da empresa para a mensagem
    const company = await db.company.findUnique({ where: { id: companyId } });

    // 4. Gerar WhatsApp Link com o Magic Link de aceite
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.token}`;
    
    const message = `Olá ${name}! 👋\n\n` +
      `Você foi convidado por ${session.user.name} para se juntar à equipe da *${company?.name}* no *Kipo*.\n\n` +
      `Para aceitar o convite e configurar seu acesso, clique no link seguro abaixo:\n\n` +
      `🔗 *Aceitar Convite:* ${inviteLink}\n\n` +
      `_Este link expira em 48 horas por segurança._`;

    const whatsappUrl = getWhatsAppUrl(phone, message);

    revalidatePath("/settings/team");
    
    return { 
        success: true, 
        whatsappUrl 
    };
  });
