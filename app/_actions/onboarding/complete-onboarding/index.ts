"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { completeOnboardingSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";

export const completeOnboarding = actionClient
  .schema(completeOnboardingSchema)
  .action(async ({ parsedInput: { companyName, productName, productPrice, productStock } }) => {
    const companyId = await getCurrentCompanyId();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Usuário não autenticado");
    }

    await db.$transaction(async (trx) => {
      // 1. Update company name
      await trx.company.update({
        where: { id: companyId },
        data: { name: companyName },
      });

      // 2. Create first product
      const product = await trx.product.create({
        data: {
          name: productName,
          price: productPrice,
          stock: 0, // Will be set via movement
          companyId: companyId,
        },
      });

      // 3. Set initial stock via movement for auditability
      if (productStock > 0) {
        await recordStockMovement(
          {
            productId: product.id,
            companyId,
            userId,
            type: "MANUAL",
            quantity: productStock,
            reason: "Configuração inicial (Onboarding)",
          },
          trx
        );
      }
    });

    revalidatePath("/", "layout");
    
    return { success: true };
  });
