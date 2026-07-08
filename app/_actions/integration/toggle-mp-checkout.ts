"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { toggleMpCheckoutSchema } from "./schema";
import { assertRole } from "@/app/_lib/rbac";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const toggleMpCheckoutAction = actionClient
  .schema(toggleMpCheckoutSchema)
  .action(async ({ parsedInput: { companyId, isEnabled } }) => {
    // Apenas admins podem configurar pagamentos
    await assertRole(["OWNER", "ADMIN"]);

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
