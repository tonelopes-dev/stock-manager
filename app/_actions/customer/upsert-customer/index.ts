"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertCustomerSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ALL_ROLES, assertRole } from "@/app/_lib/rbac";

export const upsertCustomer = actionClient
  .schema(upsertCustomerSchema)
  .action(async ({ parsedInput: { id, birthday, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);
    await requireActiveSubscription(companyId);

    const { categoryIds, ...otherData } = data;

    const customerData: any = {
      name: otherData.name,
      email: otherData.email || null,
      phone: otherData.phone || null,
      stageId: otherData.stageId || null,
      notes: otherData.notes || null,
      birthday: birthday ? new Date(birthday) : null,
    };

    if (categoryIds) {
      customerData.categories = {
        [id ? "set" : "connect"]: categoryIds.map((id) => ({ id })),
      };
    }

    // Check for duplicate email (only if email is provided)
    if (customerData.email) {
      const existingByEmail = await db.customer.findFirst({
        where: {
          companyId,
          email: customerData.email,
          ...(id ? { id: { not: id } } : {}),
        },
        select: { id: true },
      });

      if (existingByEmail) {
        returnValidationErrors(upsertCustomerSchema, {
          email: { _errors: ["Já existe um cliente cadastrado com este e-mail."] },
        });
      }
    }

    // Check for duplicate phone (only if phone is provided)
    if (customerData.phone) {
      const existingByPhone = await db.customer.findFirst({
        where: {
          companyId,
          phone: customerData.phone,
          ...(id ? { id: { not: id } } : {}),
        },
        select: { id: true },
      });

      if (existingByPhone) {
        returnValidationErrors(upsertCustomerSchema, {
          phone: { _errors: ["Já existe um cliente cadastrado com este telefone."] },
        });
      }
    }

    if (id) {
      const existingCustomer = await db.customer.findUnique({
        where: { id, companyId },
        select: { stageId: true },
      });

      if (
        existingCustomer &&
        existingCustomer.stageId !== customerData.stageId
      ) {
        // Moved to a new stage via modal: calculate next position
        const lastPosition = await db.customer.aggregate({
          where: { companyId, stageId: customerData.stageId || "" },
          _max: { position: true },
        });
        const nextPosition = (lastPosition._max.position ?? -1) + 1;

        await db.customer.update({
          where: { id, companyId },
          data: { ...customerData, position: nextPosition },
        });
      } else {
        await db.customer.update({
          where: { id, companyId },
          data: customerData,
        });
      }
    } else {
      // New customer: calculate next position
      const lastPosition = await db.customer.aggregate({
        where: { companyId, stageId: customerData.stageId || "" },
        _max: { position: true },
      });
      const nextPosition = (lastPosition._max.position ?? -1) + 1;

      await db.customer.create({
        data: {
          ...customerData,
          position: nextPosition,
          companyId,
        },
      });
    }

    revalidatePath("/customers", "page");
  });
