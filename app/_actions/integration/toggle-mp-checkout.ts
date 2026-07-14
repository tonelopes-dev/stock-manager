"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { assertActionCapability } from "@/app/_lib/rbac";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

const toggleMpCheckoutSchema = z.object({
  companyId: z.string().min(1),
  isEnabled: z.boolean(),
});

export const toggleMpCheckoutAction = actionClient
  .schema(toggleMpCheckoutSchema)
  .action(async ({ parsedInput: { companyId, isEnabled } }) => {
    // Guard: OWNER bypass | requer INTEGRATIONS_MANAGE
    await assertActionCapability(PERMISSIONS.INTEGRATIONS_MANAGE);

    const currentCompanyId = await getCurrentCompanyId();
    if (currentCompanyId !== companyId) {
      throw new Error("Ação não autorizada.");
    }

    try {
      await db.company.update({
        where: { id: companyId },
        data: { mpCheckoutEnabled: isEnabled },
      });

      // Atualiza os painéis (Hub de Integração e My Orders se possível)
      revalidatePath("/integracoes");
      revalidatePath("/[companySlug]/my-orders", "page");

      return { success: true };
    } catch (error) {
      console.error("[TOGGLE_MP_CHECKOUT] Error:", error);
      throw new Error("Erro interno no banco de dados. Por favor, tente novamente.");
    }
  });
