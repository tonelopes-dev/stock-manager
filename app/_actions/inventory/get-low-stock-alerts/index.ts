"use server";

import { db } from "@/app/_lib/prisma";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";

export const getLowStockAlerts = actionClient
  .schema(z.object({}))
  .action(async () => {
    const companyId = await getCurrentCompanyId();

    const lowStockProducts = await db.product.findMany({
      where: {
        companyId,
        isActive: true, // Apenas itens ativos
        type: {
          in: ["INSUMO", "REVENDA"], // Alertas apenas para produtos físicos
        },
        stock: {
          lte: db.product.fields.minStock, // estoque <= minStock
        },
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        unit: true,
      },
      orderBy: {
        stock: "asc", // Mostrar o mais crítico primeiro (menor estoque)
      },
    });

    return lowStockProducts.map((p) => ({
      id: `stock-${p.id}`,
      type: "inventory",
      message: `Estoque Baixo: ${p.name} (${Number(p.stock)} ${p.unit})`,
      timestamp: new Date(), // Como é derivado, usamos a data da consulta
      read: false,
      href: "/ingredients", // Redirecionar para a tela de insumos para ajustar/comprar
    }));
  });
