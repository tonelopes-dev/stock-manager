"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertEnvironmentSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const upsertEnvironment = actionClient
  .schema(upsertEnvironmentSchema)
  .action(async ({ parsedInput: { id, name, orderIndex } }) => {
    const companyId = await getCurrentCompanyId();
    if (!companyId) {
      throw new Error("CompainId not found");
    }

    if (id) {
      await db.environment.update({
        where: { id },
        data: {
          name,
          orderIndex: orderIndex ?? 0,
        },
      });
    } else {
      await db.environment.create({
        data: {
          name,
          orderIndex: orderIndex ?? 0,
          companyId,
        },
      });
    }

    revalidatePath("/cardapio");
    return { success: true };
  });
