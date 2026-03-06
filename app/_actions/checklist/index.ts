"use server";

import { db } from "@/app/_lib/prisma";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { ALL_ROLES, assertRole } from "@/app/_lib/rbac";
import { z } from "zod";
import { revalidatePath } from "next/cache";

// SCHEMAS
const toggleItemSchema = z.object({
  id: z.string(),
  isChecked: z.boolean(),
});

const applyTemplateSchema = z.object({
  customerId: z.string(),
  templateId: z.string(),
});

const createChecklistSchema = z.object({
  customerId: z.string(),
  title: z.string().min(1, "O título é obrigatório"),
});

const deleteChecklistSchema = z.object({
  id: z.string(),
});

const updateChecklistTitleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "O título é obrigatório"),
});

const createItemSchema = z.object({
  checklistId: z.string(),
  title: z.string().min(1, "O título é obrigatório"),
});

const updateItemTitleSchema = z.object({
  id: z.string(),
  title: z.string().min(1, "O título é obrigatório"),
});

const deleteItemSchema = z.object({
  id: z.string(),
});

// ACTIONS
export const toggleChecklistItem = actionClient
  .schema(toggleItemSchema)
  .action(async ({ parsedInput: { id, isChecked } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklistItem.update({
      where: { id, companyId },
      data: { isChecked },
    });

    revalidatePath("/customers");
  });

export const applyChecklistTemplate = actionClient
  .schema(applyTemplateSchema)
  .action(async ({ parsedInput: { customerId, templateId } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    const template = await db.checklistTemplate.findUnique({
      where: { id: templateId, companyId },
    });

    if (!template) {
      throw new Error("Template não encontrado.");
    }

    const items = template.items as string[];

    await db.checklist.create({
      data: {
        title: template.name,
        customerId,
        companyId,
        items: {
          create: items.map((item, index) => ({
            title: item,
            order: index,
            companyId,
          })),
        },
      },
    });

    revalidatePath("/customers");
  });

export const createChecklist = actionClient
  .schema(createChecklistSchema)
  .action(async ({ parsedInput: { customerId, title } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklist.create({
      data: {
        title,
        customerId,
        companyId,
      },
    });

    revalidatePath("/customers");
  });

export const deleteChecklist = actionClient
  .schema(deleteChecklistSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklist.delete({
      where: { id, companyId },
    });

    revalidatePath("/customers");
  });

export const updateChecklistTitle = actionClient
  .schema(updateChecklistTitleSchema)
  .action(async ({ parsedInput: { id, title } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklist.update({
      where: { id, companyId },
      data: { title },
    });

    revalidatePath("/customers");
  });

export const createChecklistItem = actionClient
  .schema(createItemSchema)
  .action(async ({ parsedInput: { checklistId, title } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    // Get the last order position
    const lastItem = await db.checklistItem.findFirst({
      where: { checklistId, companyId },
      orderBy: { order: "desc" },
    });

    const order = lastItem ? lastItem.order + 1 : 0;

    await db.checklistItem.create({
      data: {
        checklistId,
        title,
        order,
        companyId,
      },
    });

    revalidatePath("/customers");
  });

export const updateChecklistItemTitle = actionClient
  .schema(updateItemTitleSchema)
  .action(async ({ parsedInput: { id, title } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklistItem.update({
      where: { id, companyId },
      data: { title },
    });

    revalidatePath("/customers");
  });

export const deleteChecklistItem = actionClient
  .schema(deleteItemSchema)
  .action(async ({ parsedInput: { id } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklistItem.delete({
      where: { id, companyId },
    });

    revalidatePath("/customers");
  });
