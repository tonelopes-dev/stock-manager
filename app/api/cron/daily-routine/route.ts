import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // 1. Security check
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    // 2. Calculate threshold date (3 days ahead)
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 3);
    warningDate.setHours(23, 59, 59, 999);

    const checkDateLimit = new Date();
    checkDateLimit.setDate(checkDateLimit.getDate() - 3); // 3 days ago for anti-spam

    // 3. Scan Products
    const expiringProducts = await db.product.findMany({
      where: {
        isActive: true,
        trackExpiration: true,
        expirationDate: {
          lte: warningDate,
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        expirationDate: true,
        companyId: true,
      },
    });

    // 4. Scan Ingredients
    const expiringIngredients = await db.ingredient.findMany({
      where: {
        isActive: true,
        trackExpiration: true,
        expirationDate: {
          lte: warningDate,
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        expirationDate: true,
        companyId: true,
      },
    });

    const items = [
      ...expiringProducts.map((p) => ({ ...p, itemType: "Produto" })),
      ...expiringIngredients.map((i) => ({ ...i, itemType: "Insumo" })),
    ];

    let createdCount = 0;

    for (const item of items) {
      if (!item.expirationDate) continue;

      // 5. Prevenção de Spam: Check if a notification for this item exists in the last 3 days
      const existingNotification = await db.notification.findFirst({
        where: {
          companyId: item.companyId,
          type: "EXPIRATION_ALERT",
          isRead: false,
          message: {
            contains: item.name,
          },
          createdAt: {
            gte: checkDateLimit,
          },
        },
      });

      if (!existingNotification) {
        await db.notification.create({
          data: {
            title: `Atenção: ${item.itemType} Vencendo`,
            message: `O item ${item.name} vence no dia ${format(
              item.expirationDate,
              "dd/MM/yyyy",
              { locale: ptBR }
            )}.`,
            type: "EXPIRATION_ALERT",
            companyId: item.companyId,
          },
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      scanned: items.length,
      created: createdCount,
    });
  } catch (error) {
    console.error("[CRON ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
