"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { inviteUserSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { assertRole, ADMIN_AND_OWNER } from "@/app/_lib/rbac";

export const inviteUser = actionClient
  .schema(inviteUserSchema)
  .action(async ({ parsedInput: { email, role } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ADMIN_AND_OWNER);


    // Check if user is already in the company
    const existingMember = await db.userCompany.findFirst({
      where: {
        companyId,
        user: { email },
      },
    });

    if (existingMember) {
      throw new Error("Usuário já é membro da empresa.");
    }

    // Check if there is already a pending invitation
    const existingInvitation = await db.companyInvitation.findFirst({
      where: {
        email,
        companyId,
        status: "PENDING",
      },
    });

    if (existingInvitation) {
      throw new Error("Já existe um convite pendente para este email.");
    }

    await db.companyInvitation.create({
      data: {
        email,
        role,
        companyId,
      },
    });

    revalidatePath("/company/members");
  });
