"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { recalculateProductCost } from "../recipe/recalculate-cost";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType } from "@prisma/client";



export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);
    await requireActiveSubscription(companyId);


    const sku = data.sku?.trim() || null;

    await db.$transaction(async (trx) => {
      const { stock, type, cost, ...rest } = data;
      
      const updateData = { 
        ...rest, 
        sku, 
        type,
        cost: type === "PREPARED" ? undefined : cost
      };


      let productId = id;

      if (id) {
        const updatedProduct = await trx.product.update({
          where: { id, companyId },
          data: updateData,
        });

        if (updatedProduct.type === "PREPARED") {
          await recalculateProductCost(id, trx);
        }
      } else {
        const product = await trx.product.create({
          data: { 
            ...updateData, 
            cost: type === "PREPARED" ? 0 : (cost || 0),
            companyId, 
            stock: 0 
          },
        });
        productId = product.id;

        // Activation Tracking: First Product
        const company = await trx.company.findUnique({
          where: { id: companyId },
          select: { firstProductAt: true }
        });

        if (!company?.firstProductAt) {
          await trx.company.update({
            where: { id: companyId },
            data: { firstProductAt: new Date() }
          });
        }

        if (type !== "PREPARED" && stock && stock > 0) {
          await recordStockMovement(
            {
              productId: product.id,
              companyId,
              userId,
              type: "MANUAL",
              quantity: stock,
              reason: "Estoque inicial",
            },
            trx
          );
        }
      }

      // 3. Log Audit within transaction
      await AuditService.logWithTransaction(trx, {
        type: id ? AuditEventType.PRODUCT_UPDATED : AuditEventType.PRODUCT_CREATED,
        companyId,
        entityType: "PRODUCT",
        entityId: productId,
        metadata: {
          productId,
          sku,
          name: data.name,
        },
      });
    });



    revalidatePath("/products", "page");
    revalidatePath("/");
  });
