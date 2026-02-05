"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { acceptInvitationSchema, rejectInvitationSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { auth } from "@/app/_lib/auth";

export const acceptInvitation = actionClient
  .schema(acceptInvitationSchema)
  .action(async ({ parsedInput: { invitationId } }) => {
    const session = await auth();
    const userEmail = session?.user?.email;
    const userId = session?.user?.id;

    if (!userId || !userEmail) {
      throw new Error("Usuário não autenticado.");
    }

    const invitation = await db.companyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.status !== "PENDING" || invitation.email !== userEmail) {
      throw new Error("Convite inválido ou não encontrado.");
    }

    await db.$transaction(async (trx) => {
      // Create relationship
      await trx.userCompany.create({
        data: {
          userId,
          companyId: invitation.companyId,
          role: invitation.role,
        },
      });

      // Update invitation status
      await trx.companyInvitation.update({
        where: { id: invitationId },
        data: { status: "ACCEPTED" },
      });
    });

    revalidatePath("/company/members");
    revalidatePath("/");
  });

export const rejectInvitation = actionClient
  .schema(rejectInvitationSchema)
  .action(async ({ parsedInput: { invitationId } }) => {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) {
      throw new Error("Usuário não autenticado.");
    }

    const invitation = await db.companyInvitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation || invitation.status !== "PENDING" || invitation.email !== userEmail) {
      throw new Error("Convite inválido ou não encontrado.");
    }

    await db.companyInvitation.update({
      where: { id: invitationId },
      data: { status: "REJECTED" },
    });

    revalidatePath("/company/members");
  });
