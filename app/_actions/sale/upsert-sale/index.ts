"use server";

import { db } from "@/app/_lib/prisma";
import { upsertSaleSchema } from "./schema";
import { revalidatePath } from "next/cache";
import { actionClient } from "@/app/_lib/safe-action";
import { returnValidationErrors } from "next-safe-action";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { auth } from "@/app/_lib/auth";
import { recordStockMovement } from "@/app/_lib/stock";

export const upsertSale = actionClient
  .schema(upsertSaleSchema)
  .action(async ({ parsedInput: { products, id, date } }) => {
    const companyId = await getCurrentCompanyId();
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const isUpdate = Boolean(id);
    await db.$transaction(async (trx) => {
      if (isUpdate) {
        const existingSale = await trx.sale.findFirst({
          where: { id, companyId },
          include: { saleProducts: true },
        });
        if (!existingSale) return;

        if (existingSale.status === "CANCELED") {
          throw new Error("Cannot update a canceled sale.");
        }

        // Revert stock for existing products in the sale
        for (const product of existingSale.saleProducts) {
          await recordStockMovement(
            {
              productId: product.productId,
              companyId,
              userId,
              type: "CANCEL",
              quantity: product.quantity,
              saleId: existingSale.id,
            },
            trx
          );
        }

        // Delete existing sale products
        await trx.saleProduct.deleteMany({
          where: { saleId: id },
        });

        // Update sale date if provided
        await trx.sale.update({
          where: { id },
          data: {
            date: date || existingSale.date,
          },
        });
      }

      let sale;
      if (isUpdate) {
        sale = { id };
      } else {
        sale = await trx.sale.create({
          data: {
            date: date || new Date(),
            companyId,
          },
        });
      }

      const company = await trx.company.findUnique({
        where: { id: companyId },
        select: { allowNegativeStock: true },
      });

      for (const product of products) {
        const productFromDb = await trx.product.findUnique({
          where: {
            id: product.id,
          },
        });
        if (!productFromDb) {
          returnValidationErrors(upsertSaleSchema, {
            _errors: ["Product not found."],
          });
        }
        if (!productFromDb.isActive) {
          returnValidationErrors(upsertSaleSchema, {
            _errors: [`O produto ${productFromDb.name} está desativado e não pode ser vendido.`],
          });
        }
        const productIsOutOfStock = product.quantity > productFromDb.stock;
        if (productIsOutOfStock && !company?.allowNegativeStock) {
          returnValidationErrors(upsertSaleSchema, {
            _errors: [`Estoque insuficiente para o produto ${productFromDb.name}.`],
          });
        }
        await trx.saleProduct.create({
          data: {
            saleId: sale.id as string,
            productId: product.id,
            quantity: product.quantity,
            unitPrice: productFromDb.price,
            baseCost: productFromDb.cost,
          },
        });
        await recordStockMovement(
          {
            productId: product.id,
            companyId,
            userId,
            type: "SALE",
            quantity: -product.quantity,
            saleId: sale.id as string,
          },
          trx
        );
      }
    });
    revalidatePath("/", "layout");
  });

