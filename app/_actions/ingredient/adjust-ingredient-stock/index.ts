import { revalidatePath } from "next/cache";
import { adjustIngredientStockSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { IngredientService } from "@/app/_services/ingredient";


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
