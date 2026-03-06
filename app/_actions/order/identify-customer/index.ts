"use server";

import { db } from "@/app/_lib/prisma";
import { z } from "zod";
import { actionClient } from "@/app/_lib/safe-action";

const identifyCustomerSchema = z.object({
  companyId: z.string(),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres"),
  phoneNumber: z.string().min(8, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  birthDate: z.string().optional().or(z.literal("")),
});

export const identifyCustomerAction = actionClient
  .schema(identifyCustomerSchema)
  .action(async ({ parsedInput: { companyId, name, phoneNumber, email, birthDate } }) => {
    // Normalize phone
    const normalizedPhone = phoneNumber.replace(/\D/g, "");

    // Final registration / identification
    // We use upsert-like logic but specifically for the MENU source if creating
    
    // Check if exists one last time (concurrency)
    const existing = await db.customer.findFirst({
      where: {
        phoneNumber: normalizedPhone,
        companyId,
      },
      select: { id: true },
    });

    if (existing) {
      const updated = await db.customer.update({
        where: { id: existing.id },
        data: {
          name,
          ...(email ? { email } : {}),
          ...(birthDate ? { birthDate: new Date(birthDate) } : {}),
        },
      });

      return { customerId: updated.id, customerName: updated.name };
    }

    // Create new customer with source MENU
    // Note: Ensuring CustomerSource enum is used correctly
    const customer = await db.customer.create({
      data: {
        name,
        phoneNumber: normalizedPhone,
        email: email || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        source: "MENU", 
        companyId,
        position: 0,
      },
    });

    return { customerId: customer.id, customerName: customer.name };
  });
