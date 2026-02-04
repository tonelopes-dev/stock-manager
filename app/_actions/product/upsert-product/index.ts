"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";

export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    upsertProductSchema.parse(data);
    await db.product.upsert({
      where: { id: id ?? "" },
      update: data,
      create: { ...data, companyId },
    });
    revalidatePath("/products", "page");
    revalidatePath("/");
  });
