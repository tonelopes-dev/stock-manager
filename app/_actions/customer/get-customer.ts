"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { getCustomerById } from "@/app/_data-access/customer/get-customer-by-id";

export const getCustomerAction = actionClient
  .schema(z.object({ id: z.string() }))
  .action(async ({ parsedInput: { id } }) => {
    return await getCustomerById(id);
  });
