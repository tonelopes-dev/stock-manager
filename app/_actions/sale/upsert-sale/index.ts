"use server";

import { upsertSaleSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { SaleService } from "@/app/_services/sale";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";

export const upsertSale = actionClient
  .schema(upsertSaleSchema)
  .action(async ({ parsedInput: { products, id, date } }) => {
    const companyId = await getCurrentCompanyId();
    
    // Role Guard: Only OWNER/ADMIN can edit. Anyone can create.
    if (id) {
      await assertRole(ADMIN_AND_OWNER);
    }
    
    await requireActiveSubscription(companyId);

    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    try {
      await SaleService.upsertSale({
        id,
        date,
        companyId,
        userId,
        products,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ocorreu um erro ao processar a venda.";
      returnValidationErrors(upsertSaleSchema, {
        _errors: [message],
      });
    }

    revalidatePath("/", "layout");
    revalidatePath("/dashboard");
    revalidatePath("/sales");
    revalidatePath("/products");
  });

