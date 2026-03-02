"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { updateCustomerStageSchema } from "./schema";

export const updateCustomerStage = actionClient
  .schema(updateCustomerStageSchema)
  .action(async ({ parsedInput: { customerId, stageId } }) => {
    const companyId = await getCurrentCompanyId();

    await db.customer.update({
      where: { id: customerId, companyId },
      data: { stageId },
    });

    revalidatePath("/customers");
  });
