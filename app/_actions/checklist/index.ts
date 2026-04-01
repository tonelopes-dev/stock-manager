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

const updateItemDueDateSchema = z.object({
  id: z.string(),
  dueDate: z.date().nullable(),
});

// ACTIONS
export const toggleChecklistItem = actionClient
  .schema(toggleItemSchema)
  .action(async ({ parsedInput: { id, isChecked } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    const item = await db.checklistItem.findUnique({
      where: { id, companyId },
      include: { 
        checklist: { 
          include: { customer: true } 
        } 
      }
    });

    if (!item) throw new Error("Item não encontrado.");

    const completedAt = isChecked ? new Date() : null;

    await db.checklistItem.update({
      where: { id, companyId },
      data: { isChecked, completedAt },
    });

    if (isChecked) {
      const { AuditService } = await import("@/app/_services/audit");
      const { AuditEventType } = await import("@prisma/client");
      
      await AuditService.log({
        type: AuditEventType.CHECKLIST_ITEM_COMPLETED,
        companyId,
        entityType: "CUSTOMER",
        entityId: item.checklist.customerId,
        metadata: {
          itemTitle: item.title,
          checklistTitle: item.checklist.title,
          customerName: item.checklist.customer.name,
          customerId: item.checklist.customerId,
        },
      });
    }

    revalidatePath("/customers");
    revalidatePath("/journeys");
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

export const updateChecklistItemDueDate = actionClient
  .schema(updateItemDueDateSchema)
  .action(async ({ parsedInput: { id, dueDate } }) => {
    const companyId = await getCurrentCompanyId();
    await assertRole(ALL_ROLES);

    await db.checklistItem.update({
      where: { id, companyId },
      data: { dueDate },
    });

    revalidatePath("/customers");
    revalidatePath("/journeys");
  });
