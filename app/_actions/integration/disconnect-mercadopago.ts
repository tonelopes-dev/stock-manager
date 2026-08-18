"use server";

import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { db } from "@/app/_lib/prisma";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const disconnectMercadoPagoSchema = z.object({});

export const disconnectMercadoPagoAction = actionClient
  .schema(disconnectMercadoPagoSchema)
  .action(async () => {
    // Segurança: companyId sempre vem da sessão, nunca do input do cliente
    const companyId = await getCurrentCompanyId();
    await assertActionCapability(PERMISSIONS.INTEGRATIONS_MANAGE);

    await db.company.update({
      where: { id: companyId },
      data: {
        mpMarketplaceToken: null,
        mpMarketplaceAccountId: null,
        mpMarketplacePublicKey: null,
        mpCheckoutEnabled: false,
      },
    });

    revalidatePath("/integracoes");
    return { success: true };
  });
