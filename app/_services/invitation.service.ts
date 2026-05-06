
import { db } from "@/app/_lib/prisma";
import { UserRole } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";
import { sendEmail } from "./email.service";

export class InvitationService {
  /**
   * Cria um novo convite com token único e expiração.
   */
  static async createInvitation({
    email,
    role,
    companyId,
    permissions = [],
    inviterId,
  }: {
    email: string;
    role: UserRole;
    companyId: string;
    permissions?: string[];
    inviterId?: string;
  }) {
    // 1. Definir expiração (48h)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 48);

    // 2. Criar no banco
    const invitation = await db.companyInvitation.create({
      data: {
        email,
        role,
        companyId,
        permissions,
        inviterId,
        token: uuidv4(),
        expiresAt,
        status: "PENDING",
      },
    });

    return invitation;
  }

  /**
   * Valida se um token de convite é válido e não expirou.
   */
  static async validateToken(token: string) {
    const invitation = await db.companyInvitation.findUnique({
      where: { token },
      include: { company: { select: { name: true } } },
    });

    if (!invitation) {
      throw new Error("Convite não encontrado.");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("Este convite já foi processado.");
    }

    if (invitation.expiresAt && invitation.expiresAt < new Date()) {
      throw new Error("Convite expirado.");
    }

    return invitation;
  }

  /**
   * Aceita um convite e vincula o usuário à empresa com as permissões predefinidas.
   */
  static async acceptInvitation(token: string, userId: string) {
    const invitation = await this.validateToken(token);

    return await db.$transaction(async (trx) => {
      // 1. Criar vínculo UserCompany
      const userCompany = await trx.userCompany.create({
        data: {
          userId,
          companyId: invitation.companyId,
          role: invitation.role,
          permissions: invitation.permissions,
        },
      });

      // 2. Marcar convite como aceito
      await trx.companyInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED" },
      });

      return userCompany;
    });
  }

  /**
   * Envia o e-mail de convite usando o Resend.
   */
  static async sendInvitationEmail(invitationId: string) {
    const invitation = await db.companyInvitation.findUnique({
      where: { id: invitationId },
      include: { company: { select: { name: true } } },
    });

    if (!invitation) return;

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${invitation.token}`;

    await sendEmail({
      to: invitation.email,
      subject: `Convite para equipe: ${invitation.company.name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Você foi convidado!</h2>
          <p>Você foi convidado para se juntar à equipe da <strong>${invitation.company.name}</strong> no Kipo ERP.</p>
          <p>Como membro da equipe, você terá acesso às ferramentas de gestão conforme as permissões atribuídas.</p>
          <div style="margin: 30px 0;">
            <a href="${inviteLink}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 5px;">
              Aceitar Convite
            </a>
          </div>
          <p style="font-size: 12px; color: #666;">Este convite expira em 48 horas.</p>
        </div>
      `,
    });
  }
}
