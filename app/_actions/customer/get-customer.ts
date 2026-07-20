"use server";

import { getCustomerById } from "@/app/_data-access/customer/get-customer-by-id";
import { PERMISSIONS } from "@/app/_lib/permissions";
import { assertActionCapability } from "@/app/_lib/rbac";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";

export const getCustomerAction = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id } }) => {
    await assertActionCapability(PERMISSIONS.CUSTOMER_VIEW);
    return await getCustomerById(id);
  });
