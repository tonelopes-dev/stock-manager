"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { adjustStockSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";

export const adjustStock = actionClient
  .schema(adjustStockSchema)
  .action(async ({ parsedInput: { id, quantity, reason } }) => {
    const companyId = await getCurrentCompanyId();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    await db.$transaction(async (trx) => {
      await recordStockMovement(
        {
          productId: id,
          companyId,
          userId,
          type: "ADJUSTMENT",
          quantity,
          reason,
        },
        trx
      );
    });

    revalidatePath("/products", "page");
    revalidatePath("/");
  });
