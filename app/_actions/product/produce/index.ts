"use server";

import { revalidatePath } from "next/cache";
import { produceProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { ProductionService } from "@/app/_services/production";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";

export const produceProduct = actionClient
  .schema(produceProductSchema)
  .action(async ({ parsedInput: { productId, quantity } }) => {
    const companyId = await getCurrentCompanyId();
    await requireActiveSubscription(companyId);
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Usuário não autenticado.");
    }

    const result = await ProductionService.produce({
      productId,
      quantity,
      companyId,
      userId,
    });

    revalidatePath(`/products/${productId}`, "page");
    revalidatePath("/products", "page");
    revalidatePath("/ingredients", "page");
    revalidatePath("/");

    return {
      totalCost: Number(result.totalCost),
      quantity: result.productionOrder.quantity,
    };
  });
