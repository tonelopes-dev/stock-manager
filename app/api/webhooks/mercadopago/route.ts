import { mpClient } from "@/app/_lib/mercadopago";
import { sendEmail } from "@/app/_services/email.service";
import { subscriptionActivatedTemplate, paymentFailedTemplate } from "@/app/_services/email/templates";
import { Payment } from "mercadopago";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { SubscriptionStatus } from "@prisma/client";
import { format, addMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { searchParams } = new URL(req.url);

    // Mercado Pago provides the ID in the body (v2) or in the query params (topic/id)
    const paymentId = body.data?.id || searchParams.get("data.id") || body.id || searchParams.get("id");
    const type = body.type || searchParams.get("type") || body.topic || searchParams.get("topic");

    console.log(`[MercadoPago Webhook] Received notification: type=${type}, id=${paymentId}`);

    if (type !== "payment" || !paymentId) {
      return new NextResponse("OK", { status: 200 });
    }

    const payment = new Payment(mpClient);
    const paymentData = await payment.get({ id: paymentId.toString() });

    const companyId = paymentData.external_reference;
    const status = paymentData.status;

    console.log(`[MercadoPago Webhook] Payment ${paymentId} status: ${status}, companyId: ${companyId}`);

    if (!companyId) {
      console.error("[MercadoPago Webhook] Missing external_reference (companyId)");
      return new NextResponse("Missing external_reference", { status: 400 });
    }

    if (status === "approved") {
      // 1. Get current state BEFORE update
      const companyBefore = await db.company.findUnique({
        where: { id: companyId },
        select: { id: true, name: true, subscriptionStatus: true, expiresAt: true }
      });

      console.log("\n============================================================");
      console.log("[WEBHOOK] Estado ANTES da atualização:");
      console.log(`Empresa: ${companyBefore?.name || companyId}`);
      console.log(`Status Atual: ${companyBefore?.subscriptionStatus}`);
      console.log(`Expira em: ${companyBefore?.expiresAt?.toLocaleString() || "N/A"}`);
      console.log("============================================================\n");

      // Set expiration to 1 month from now (cumulative)
      const currentExpiresAt = companyBefore?.expiresAt;
      const now = new Date();
      const baseDate = (currentExpiresAt && isAfter(currentExpiresAt, now)) ? currentExpiresAt : now;
      const newExpiresAt = addMonths(baseDate, 1);

      // Resolve company owner for AuditEvent (actorId is mandatory)
      const owner = await db.userCompany.findFirst({
        where: { 
            companyId: companyId,
            role: "OWNER"
        },
        select: { userId: true, user: { select: { email: true, name: true } } }
      });

      // Update company status FIRST
      const companyAfter = await db.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          expiresAt: newExpiresAt,
          plan: "PRO",
          isBoletoPending: false,
        },
      });

      console.log("\n============================================================");
      console.log("[WEBHOOK] Estado DEPOIS da atualização:");
      console.log(`Novo Status: ${companyAfter.subscriptionStatus}`);
      console.log(`Nova Data de Expiração: ${companyAfter.expiresAt?.toLocaleString()}`);
      console.log("✅ Assinatura ativada com sucesso!");
      console.log("============================================================\n");

      // Send subscription activation email (from develop)
      if (owner?.user?.email) {
        try {
          await sendEmail({
            to: owner.user.email,
            subject: "Assinatura PRO Ativada! ✨",
            html: subscriptionActivatedTemplate({
              name: owner.user.name || "parceiro",
              companyName: companyBefore?.name || "sua empresa",
              expiryDateFormatted: format(newExpiresAt, "dd/MM/yyyy", { locale: ptBR }),
            }),
          });
          console.log(`[MercadoPago Webhook] Activation email sent to ${owner.user.email}`);
        } catch (err) {
          console.error("[MercadoPago Webhook] Failed to send subscription activation email:", err);
        }
      }

      // Log audit event in a separate try-catch to avoid blocking the activation if logging fails
      try {
          if (owner?.userId) {
              await db.auditEvent.create({
                data: {
                  id: `mp-sub-${paymentId}-${Date.now()}`,
                  type: "SUBSCRIPTION_ACTIVATED",
                  companyId: companyId,
                  actorId: owner.userId, 
                  actorEmail: owner.user?.email || paymentData.payer?.email || "system@mercadopago.com",
                  actorName: owner.user?.name || "Mercado Pago System",
                  severity: "INFO",
                  metadata: {
                    paymentId: paymentId,
                    status: status,
                    paymentMethod: paymentData.payment_method_id,
                    totalAmount: paymentData.transaction_amount,
                    processedBy: "MercadoPago-Webhook"
                  },
                },
              });
          } else {
              console.warn(`[MercadoPago Webhook] Skipping AuditEvent: No owner found for company ${companyId}`);
          }
      } catch (auditError: any) {
          console.error("[MercadoPago Webhook] Failed to create AuditEvent:", auditError.message);
          // Don't throw here, activation succeeded
      }

    } else if (status === "rejected" || status === "cancelled") {
        console.warn(`[MercadoPago Webhook] ⚠️ Payment ${paymentId} was ${status} for company ${companyId}`);
        
        // Resolve company owner to notify about failure
        const owner = await db.userCompany.findFirst({
          where: { 
              companyId: companyId,
              role: "OWNER"
          },
          include: { user: { select: { email: true, name: true } } }
        });

        const company = await db.company.findUnique({
          where: { id: companyId },
          select: { name: true }
        });

        if (owner?.user?.email) {
          try {
            await sendEmail({
              to: owner.user.email,
              subject: "Problema com seu pagamento ⚠️",
              html: paymentFailedTemplate({
                name: owner.user.name || "parceiro",
                companyName: company?.name || "sua empresa",
              }),
            });
            console.log(`[MercadoPago Webhook] Payment failure email sent to ${owner.user.email}`);
          } catch (err) {
            console.error("[MercadoPago Webhook] Failed to send payment failure email:", err);
          }
        }
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[MercadoPago Webhook] Error processing webhook:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
