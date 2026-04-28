"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { upsertProductSchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { requireActiveSubscription } from "@/app/_lib/subscription-guard";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, Prisma } from "@prisma/client";

/**
 * Re-calculates the cost of a product based on its composition (recursive).
 */
async function updateProductCostRecursive(
  productId: string,
  trx: Prisma.TransactionClient
) {
  const product = await trx.product.findUnique({
    where: { id: productId },
    include: {
      parentCompositions: {
        include: { child: true },
      },
    },
  });

  if (!product) return 0;

  // Only COMBO and PRODUCAO_PROPRIA have costs derived from children
  if (product.type !== "COMBO" && product.type !== "PRODUCAO_PROPRIA") {
    return Number(product.cost);
  }

  let totalCost = 0;
  for (const item of product.parentCompositions) {
    const childCost = Number(item.child.cost);
    totalCost += childCost * Number(item.quantity);
  }

  // Update this product's cost
  await trx.product.update({
    where: { id: productId },
    data: { cost: totalCost },
  });

  // Now, we might need to update any PARENTS of this product
  const compositionsWhereThisIsChild = await trx.productComposition.findMany({
    where: { childId: productId },
    select: { parentId: true },
  });

  for (const composition of compositionsWhereThisIsChild) {
    await updateProductCostRecursive(composition.parentId, trx);
  }

  return totalCost;
}

export const upsertProduct = actionClient
  .schema(upsertProductSchema)
  .action(async ({ parsedInput: { id, ...data } }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);
    await requireActiveSubscription(companyId);

    // Manual duplication check (Application Level)
    const existingProduct = await db.product.findFirst({
      where: {
        name: data.name,
        companyId,
        NOT: id ? { id } : undefined,
      },
      select: { id: true, type: true, isActive: true },
    });

    if (existingProduct) {
      const typeLabel = existingProduct.type === "INSUMO" ? "um insumo" : "um produto";
      const statusLabel = existingProduct.isActive ? "" : " (mesmo que esteja inativo)";

      throw new Error(
        `Já existe ${typeLabel} com este nome${statusLabel}. Escolha um nome diferente ou reative o item existente.`
      );
    }

    const sku = data.sku?.trim() || null;

    const result = await db.$transaction(async (trx) => {
      const { stock, unit, type, cost, operationalCost, isMadeToOrder, expirationDate, trackExpiration, imageUrl, isFeatured, ...rest } = data;
      
      const categoryId = data.categoryId?.trim() || null;
      const environmentId = data.environmentId?.trim() || null;
      
      const updateData = { 
        ...rest, 
        sku, 
        type,
        unit,
        expirationDate,
        trackExpiration,
        imageUrl,
        operationalCost,
        isMadeToOrder,
        isFeatured,
        // If it's a combo/production, we'll calculate cost later
        cost: (type === "COMBO" || type === "PRODUCAO_PROPRIA") ? undefined : cost
      };

      let productId = id;

      if (id) {
        // 1. Fetch current for stock diff
        const currentProduct = await trx.product.findUniqueOrThrow({
          where: { id, companyId },
          select: { stock: true },
        });

        const updatedProduct = await trx.product.update({
          where: { id, companyId },
          data: {
            ...updateData,
            categoryId,
            environmentId,
          },
        });

        // 2. Handle stock adjustment
        if (stock !== undefined) {
          const stockDifference = new Prisma.Decimal(stock.toString()).minus(currentProduct.stock);
          if (!stockDifference.isZero()) {
            await recordStockMovement(
              {
                productId: id,
                companyId,
                userId,
                type: "ADJUSTMENT",
                quantity: stockDifference,
                unit: updatedProduct.unit,
                reason: "Ajuste manual via edição do produto",
              },
              trx
            );
          }
        }
      } else {
        // 1. Create product
        const product = await trx.product.create({
          data: { 
            ...updateData, 
            cost: (type === "COMBO" || type === "PRODUCAO_PROPRIA") ? 0 : (cost || 0),
            companyId, 
            stock: 0,
            categoryId,
            environmentId,
          },
        });
        productId = product.id;

        // 2. Initial stock
        if (stock && stock > 0) {
          await recordStockMovement(
            {
              productId: product.id,
              companyId,
              userId,
              type: "ADJUSTMENT",
              quantity: stock,
              unit: product.unit,
              reason: "Estoque inicial",
            },
            trx
          );
        }
      }

      // 3. Update cost if it's a new combo/production (it starts at 0 and is updated later via individual additions)
      if (!id && (type === "COMBO" || type === "PRODUCAO_PROPRIA")) {
        await trx.product.update({
          where: { id: productId },
          data: { cost: 0 },
        });
      }

      // 4. Log Audit
      await AuditService.logWithTransaction(trx, {
        type: id ? AuditEventType.PRODUCT_UPDATED : AuditEventType.PRODUCT_CREATED,
        companyId,
        entityType: "PRODUCT",
        entityId: productId!,
        metadata: {
          productId,
          sku,
          name: data.name,
          unit: data.unit,
          type: data.type,
        },
      });

      return productId;
    });

    revalidatePath("/cardapio");
    revalidatePath("/estoque");
    
    return result;
  });
