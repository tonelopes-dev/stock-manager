"use server";

import { db } from "@/app/_lib/prisma";
import { revalidatePath } from "next/cache";
import { createStockEntrySchema } from "./schema";
import { actionClient } from "@/app/_lib/safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { recordStockMovement } from "@/app/_lib/stock";
import { ADMIN_AND_OWNER, assertRole } from "@/app/_lib/rbac";
import { AuditService } from "@/app/_services/audit";
import { AuditEventType, Prisma } from "@prisma/client";

/**
 * Re-calculates and updates the cost of products that depend on the modified child product.
 * (Copied logic from upsert-product to ensure consistency in ERP)
 */
async function updateParentCostsRecursive(
  childProductId: string,
  trx: Prisma.TransactionClient
) {
  // Find all products where this was a child
  const compositionsWhereThisIsChild = await trx.productComposition.findMany({
    where: { childId: childProductId },
    select: { parentId: true },
  });

  for (const item of compositionsWhereThisIsChild) {
    const parentId = item.parentId;
    
    // Fetch parent with all its components to recalculate total cost
    const parent = await trx.product.findUnique({
      where: { id: parentId },
      include: {
        parentCompositions: {
          include: { child: true },
        },
      },
    });

    if (!parent) continue;

    let totalCost = 0;
    for (const comp of parent.parentCompositions) {
      totalCost += Number(comp.child.cost) * Number(comp.quantity);
    }

    // Update parent cost
    await trx.product.update({
      where: { id: parentId },
      data: { cost: totalCost },
    });

    // Recurse to update parents of the parent
    await updateParentCostsRecursive(parentId, trx);
  }
}

export const createStockEntry = actionClient
  .schema(createStockEntrySchema)
  .action(async ({ parsedInput: data }) => {
    const companyId = await getCurrentCompanyId();
    const { userId } = await assertRole(ADMIN_AND_OWNER);

    const result = await db.$transaction(async (trx) => {
      // 1. Criar o registro de Entrada de Mercadoria
      const stockEntry = await trx.stockEntry.create({
        data: {
          productId: data.productId,
          supplierId: data.supplierId,
          quantity: data.quantity,
          unitCost: data.unitCost,
          totalCost: data.quantity * data.unitCost,
          batchNumber: data.batchNumber,
          expirationDate: data.expirationDate,
          invoiceNumber: data.invoiceNumber,
          companyId,
          userId,
        },
      });

      // 2. Registrar a Movimentação de Estoque (Incrementar estoque físico)
      await recordStockMovement(
        {
          productId: data.productId,
          companyId,
          userId,
          type: "PURCHASE",
          quantity: data.quantity,
          reason: `Entrada de mercadoria - NF: ${data.invoiceNumber || "N/A"}`,
        },
        trx
      );

      // 3. Atualizar o Custo do Produto (Last Purchase Price)
      const updatedProduct = await trx.product.update({
        where: { id: data.productId },
        data: {
          cost: data.unitCost,
        },
      });

      // 4. Recalcular Custos de Receitas dependentas (BOM)
      await updateParentCostsRecursive(data.productId, trx);

      // 5. Auditoria
      await AuditService.logWithTransaction(trx, {
        type: AuditEventType.STOCK_ADJUSTED, // Mapear para um novo tipo se necessário
        companyId,
        entityType: "STOCK_ENTRY",
        entityId: stockEntry.id,
        metadata: {
          productId: data.productId,
          quantity: data.quantity,
          unitCost: data.unitCost,
          invoiceNumber: data.invoiceNumber,
        },
      });

      return stockEntry;
    });

    // Revalidação de caminhos afetados
    revalidatePath("/estoque");
    revalidatePath("/products");
    revalidatePath("/estoque");
    revalidatePath("/dashboard");
    revalidatePath("/reports");

    return result;
  });
