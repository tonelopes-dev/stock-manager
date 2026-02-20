"use server";

import { auth } from "@/app/_lib/auth";
import { db } from "@/app/_lib/prisma";
import { redirect } from "next/navigation";

export const adjustIngredientStock = actionClient
  .schema(adjustIngredientStockSchema)
  .action(async ({ parsedInput: { id, quantity, reason } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);


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
