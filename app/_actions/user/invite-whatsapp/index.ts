"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

const inviteSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(10), // Required for WhatsApp
  role: z.nativeEnum(UserRole),
});

export const inviteUserViaWhatsApp = actionClient
  .schema(inviteSchema)
  .action(async ({ parsedInput: { name, email, phone, role } }) => {
    const session = await auth();
    const companyId = await getCurrentCompanyId();

    if (!session?.user?.id || !companyId) {
      throw new Error("Não autorizado.");
    }

    // 1. Generate a strong temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + "!ST";
    const hashedPassword = await bcrypt.hash(tempPassword, 12);

    // 2. Transacional creation
    await db.$transaction(async (trx) => {
      // Create user if not exists
      let user = await trx.user.findUnique({ where: { email } });

      if (!user) {
        user = await trx.user.create({
          data: {
            name,
            email,
            phone,
            password: hashedPassword,
            needsPasswordChange: true,
          },
        });
      }

      // Link to company
      await trx.userCompany.upsert({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId,
          },
        },
        update: { role },
        create: {
          userId: user.id,
          companyId,
          role,
        },
      });
    });

    // 3. Generate WhatsApp Link
    const company = await db.company.findUnique({ where: { id: companyId } });
    const encodedMessage = encodeURIComponent(
      `Olá ${name}! 👋\n\n` +
      `Você foi convidado por ${session.user.name} para se juntar à equipe da *${company?.name}* no *Stocky*.\n\n` +
      `Seu acesso como *${role === "ADMIN" ? "Administrador" : "Membro"}* está pronto:\n` +
      `🔐 *E-mail:* ${email}\n` +
      `🔑 *Senha Temporária:* ${tempPassword}\n\n` +
      `🔗 *Acesse aqui:* ${process.env.NEXTAUTH_URL}/login\n\n` +
      `*Por segurança, o sistema solicitará que você crie sua própria senha no primeiro acesso.*`
    );

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodedMessage}`;

    revalidatePath("/settings/team");
    
    return { 
        success: true, 
        whatsappUrl,
        tempPassword // Just in case UI wants to show it
    };
  });
