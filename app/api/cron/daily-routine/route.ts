import { NextRequest, NextResponse } from "next/server";
import { db } from "@/app/_lib/prisma";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sendEmail } from "@/app/_services/email.service";
import { subscriptionReminderTemplate } from "@/app/_services/email/templates";

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

    // 3. Scan Expiring Items (Unified)
    const expiringItems = await db.product.findMany({
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
        type: true,
        expirationDate: true,
        companyId: true,
        environment: {
          select: { name: true },
        },
      },
    });

    const items = expiringItems.map((item) => ({ 
      ...item, 
      itemType: item.type === "INSUMO" ? "Insumo" : "Produto" 
    }));

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
        const envSuffix = (item as any).environment?.name 
          ? ` (Ambiente: ${(item as any).environment.name})` 
          : "";

        await db.notification.create({
          data: {
            title: `Atenção: ${item.itemType} Vencendo`,
            message: `O item ${item.name}${envSuffix} vence no dia ${format(
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

    // --- 6. Subscription Reminders ---
    const today = startOfDay(new Date());
    const in3Days = startOfDay(addDays(today, 3));

    const expiringCompanies = await db.company.findMany({
      where: {
        expiresAt: {
          not: null,
          gte: today,
          lte: endOfDay(in3Days),
        },
        subscriptionStatus: {
          in: ["ACTIVE", "TRIALING"],
        },
      },
      include: {
        userCompanies: {
          where: { role: "OWNER" },
          include: { user: { select: { email: true, name: true } } },
        },
      },
    });

    let emailsSent = 0;

    for (const company of expiringCompanies) {
      if (!company.expiresAt) continue;

      const owner = company.userCompanies[0]?.user;
      if (!owner?.email) continue;

      const companyExpiresAt = startOfDay(company.expiresAt);
      const daysLeft = Math.ceil((companyExpiresAt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      // Only send exactly at 3 days left or 0 days left
      if (daysLeft === 3 || daysLeft === 0) {
        const subject = daysLeft === 0 
          ? "Sua assinatura Kipo vence hoje!" 
          : `Sua assinatura Kipo vence em ${daysLeft} dias`;

        const title = daysLeft === 0
          ? "⚠️ Sua assinatura vence hoje!"
          : `🔔 Lembrete: ${daysLeft} dias para o vencimento`;

        const message = daysLeft === 0
          ? `Sua assinatura para a empresa <strong>${company.name}</strong> vence hoje. Para evitar interrupção no serviço, realize a renovação agora.`
          : `Gostaríamos de lembrar que sua assinatura para a empresa <strong>${company.name}</strong> vence em ${daysLeft} dias (${format(company.expiresAt, "dd/MM/yyyy", { locale: ptBR })}).`;

        try {
          await sendEmail({
            to: owner.email,
            subject,
            html: subscriptionReminderTemplate({
                name: owner.name || "parceiro",
                companyName: company.name,
                daysLeft,
                expiryDateFormatted: format(company.expiresAt, "dd/MM/yyyy", { locale: ptBR }),
            }),
          });
          emailsSent++;

          // Also create a system notification
          await db.notification.create({
            data: {
              title: subject,
              message: message.replace(/<[^>]*>/g, ""),
              type: "EXPIRATION_ALERT",
              companyId: company.id,
            },
          });
        } catch (err) {
          console.error(`Failed to send reminder to ${owner.email}:`, err);
        }
      }
    }

    return NextResponse.json({
      success: true,
      scanned: items.length,
      created: createdCount,
      emailsSent: emailsSent,
    });
  } catch (error) {
    console.error("[CRON ERROR]:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
