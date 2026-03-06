"use server";

import { db } from "@/app/_lib/prisma";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";

const checkPhoneSchema = z.object({
  companyId: z.string(),
  phoneNumber: z.string().min(8, "Telefone inválido"),
});

export const checkCustomerPhoneAction = actionClient
  .schema(checkPhoneSchema)
  .action(async ({ parsedInput: { companyId, phoneNumber } }) => {
    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    const customer = await db.customer.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        companyId,
      },
      select: { 
        id: true, 
        name: true,
        email: true,
        birthDate: true,
      },
    });

    if (customer) {
      return { 
        found: true, 
        customerId: customer.id, 
        name: customer.name,
        email: customer.email,
        phoneNumber: normalizedPhone,
      };
    }

    return { found: false };
  });
