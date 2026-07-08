"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { assertRole } from "@/app/_lib/rbac";
import { revalidatePath } from "next/cache";

const disconnectMercadoPagoSchema = z.object({
  companyId: z.string().min(1),
});

export const disconnectMercadoPagoAction = actionClient
  .schema(disconnectMercadoPagoSchema)
  .action(async ({ parsedInput: { companyId } }) => {
    await assertRole(["OWNER", "ADMIN"]);
    
    // Check if company exists and user has access
    const company = await db.company.findUnique({
      where: { id: companyId },
    });
    
    if (!company) {
      throw new Error("Company not found");
    }

    await db.company.update({
      where: { id: companyId },
      data: {
        mpMarketplaceToken: null,
        mpMarketplaceAccountId: null,
        // Mantemos kipoMarketplaceFeeRate caso precise depois, ou podemos nullificar também.
      },
    });

    revalidatePath("/integracoes");
    return { success: true };
  });
