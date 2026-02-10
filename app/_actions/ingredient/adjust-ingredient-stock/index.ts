"use server";

import { revalidatePath } from "next/cache";
import { adjustIngredientStockSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { IngredientService } from "@/app/_services/ingredient";
import { isAdminOrOwner } from "@/app/_lib/rbac";

export const adjustIngredientStock = actionClient
  .schema(adjustIngredientStockSchema)
  .action(async ({ parsedInput: { id, quantity, reason } }) => {
    const companyId = await getCurrentCompanyId();
    await isAdminOrOwner();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await IngredientService.adjustStock({
      ingredientId: id,
      companyId,
      userId,
      quantity,
      reason,
    });

    revalidatePath("/ingredients", "page");
    revalidatePath("/");
  });
