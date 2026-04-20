"use server";

import { db } from "@/app/_lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentCompanyId } from "@/app/_lib/get-current-company";
import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { addDays, isPast, isBefore } from "date-fns";

export const getInventoryAlerts = actionClient
  .schema(z.object({}))
  .action(async () => {
    const companyId = await getCurrentCompanyId();
    const now = new Date();
    const thresholdDate = addDays(now, 3);

    // 1. Fetch Low Stock Products
    const lowStockProducts = await db.product.findMany({
      where: {
        companyId,
        isActive: true,
        type: { in: ["INSUMO", "REVENDA"] },
        OR: [
          { stock: { lte: new Prisma.Decimal(0) } },
          { stock: { lte: db.product.fields.minStock } }
        ],
      },
      select: {
        id: true,
        name: true,
        stock: true,
        minStock: true,
        cost: true,
        unit: true,
        category: {
          select: { name: true }
        },
        suppliers: {
          include: {
            supplier: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { stock: "asc" },
    });

    const lowStockNotifications = lowStockProducts.map((p) => ({
      id: `stock-${p.id}`,
      type: "inventory",
      message: `Estoque Baixo: ${p.name} (${Number(p.stock)} ${p.unit})`,
      timestamp: now,
      read: false,
      href: "/estoque",
      // Include metadata for professional CSV reporting
      metadata: {
        name: p.name,
        category: p.category?.name || "Sem categoria",
        stock: Number(p.stock),
        minStock: Number(p.minStock),
        cost: Number(p.cost),
        unit: p.unit,
        supplierName: p.suppliers?.[0]?.supplier?.name || "Sem fornecedor"
      }
    }));

    // 2. Fetch Expiring/Expired Stock Entries
    // We only fetch entries for products that still have stock > 0
    const stockEntries = await db.stockEntry.findMany({
      where: {
        companyId,
        expirationDate: { not: null },
        product: {
          stock: { gt: new Prisma.Decimal(0) },
          isActive: true
        }
      },
      include: {
        product: {
          select: { name: true, unit: true }
        }
      },
      orderBy: { expirationDate: "asc" }
    });

    const expirationNotifications: any[] = [];
    const processedProducts = new Set<string>();

    for (const entry of stockEntries) {
      if (!entry.expirationDate || processedProducts.has(entry.productId)) continue;

      const isAlreadyExpired = isPast(entry.expirationDate);
      const isExpiringSoon = isBefore(entry.expirationDate, thresholdDate);

      if (isAlreadyExpired) {
        expirationNotifications.push({
          id: `expired-${entry.productId}`,
          type: "expired",
          message: `PRODUTO VENCIDO: ${entry.product.name} (Lote: ${entry.batchNumber || "N/A"})`,
          timestamp: now,
          read: false,
          href: "/estoque",
        });
        processedProducts.add(entry.productId);
      } else if (isExpiringSoon) {
        expirationNotifications.push({
          id: `expiring-${entry.productId}`,
          type: "expiring",
          message: `Vence em breve: ${entry.product.name} (${entry.expirationDate.toLocaleDateString("pt-BR")})`,
          timestamp: now,
          read: false,
          href: "/estoque",
        });
        processedProducts.add(entry.productId);
      }
    }

    // Combine all alerts
    return [...expirationNotifications, ...lowStockNotifications];
  });
