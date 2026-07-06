"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { toggleIntegrationSchema } from "./schema";
import { db } from "@/app/_lib/prisma";
import { assertRole } from "@/app/_lib/rbac";
import { revalidatePath } from "next/cache";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const toggleIntegration = actionClient
  .schema(toggleIntegrationSchema)
  .action(async ({ parsedInput: { id, companyId, isEnabled } }) => {
    // 1. Autorização
    await assertRole(["OWNER", "ADMIN"]);
    
    const currentCompanyId = await getCurrentCompanyId();
    if (currentCompanyId !== companyId) {
      throw new Error("Unauthorized tenant access");
    }

    // 2. Verifica se a integração que está sendo alterada é um gateway de pagamento
    const targetIntegration = await db.companyIntegration.findUnique({
      where: { id, companyId },
      select: { provider: true }
    });

    if (!targetIntegration) {
      throw new Error("Integração não encontrada");
    }

    // Se estiver ativando um gateway de pagamento, desativar os outros
    if (isEnabled && (targetIntegration.provider === "MERCADOPAGO" || targetIntegration.provider === "INFINITYPAY")) {
      await db.companyIntegration.updateMany({
        where: {
          companyId,
          provider: { in: ["MERCADOPAGO", "INFINITYPAY"] },
          id: { not: id } // Não altera o que estamos ativando agora
        },
        data: { isEnabled: false }
      });
    }

    // 3. Atualiza estado da integração alvo
    await db.companyIntegration.update({
      where: { id, companyId },
      data: { isEnabled },
    });

    revalidatePath("/integracoes");
    return { success: true };
  });
