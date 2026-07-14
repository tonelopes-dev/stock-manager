"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { assertActionCapability } from "@/app/_lib/rbac";
import { PERMISSIONS } from "@/app/_lib/permissions";

const deleteInviteSchema = z.object({
  id: z.string(),
});

export const deleteInvitation = actionClient
  .schema(deleteInviteSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.TEAM_SETTINGS_UPDATE);

    if (!companyId) {
      throw new Error("Não autorizado.");
    }

    const invite = await db.companyInvitation.findFirst({
      where: {
        id,
        companyId,
      },
    });

    if (!invite) {
      throw new Error("Convite não encontrado.");
    }

    await db.companyInvitation.delete({
      where: {
        id,
      },
    });

    revalidatePath("/settings/team");

    return { success: true };
  });
