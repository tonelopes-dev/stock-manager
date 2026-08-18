import { mpClient } from "@/app/_lib/mercadopago";
import { db } from "@/app/_lib/prisma";
import { SubscriptionStatus } from "@prisma/client";
import { addMonths, isAfter } from "date-fns";
import { Payment } from "mercadopago";
import { NextResponse } from "next/server";
import "server-only";
// TODO: Implement Email Service
// import { sendEmail } from "@/app/_lib/email/email-service";
// import { subscriptionActivatedTemplate } from "@/app/_lib/email/templates/subscription-activated";
// import { paymentFailedTemplate } from "@/app/_lib/email/templates/payment-failed";
import { IMercadoPagoWebhookBody } from "@/app/_services/payments/types";

/**
 * System Subscription Webhook Handler
 *
 * Single Responsibility: process payments related to the KIPO platform subscriptions
 * (i.e. tenants paying us for the PRO plan).
 */
export async function handleSystemSubscriptionWebhook(
  body: IMercadoPagoWebhookBody,
  searchParams: URLSearchParams
): Promise<NextResponse> {
  const bodyData = typeof body.data === "object" && body.data !== null ? (body.data as Record<string, unknown>) : {};
  const paymentId = bodyData.id ?? body.id ?? searchParams.get("data.id") ?? searchParams.get("id");
  const type = body.type ?? searchParams.get("type") ?? body.topic ?? searchParams.get("topic");

  console.log(`[MercadoPago System Webhook] Received notification: type=${type}, id=${paymentId}`);

  if (type !== "payment" || !paymentId) {
    return new NextResponse("OK", { status: 200 });
  }

  const payment = new Payment(mpClient);
  const paymentData = await payment.get({ id: paymentId.toString() });

  const companyId = paymentData.external_reference;
  const status = paymentData.status;

  console.log(`[MercadoPago System Webhook] Payment ${paymentId} status: ${status}, companyId: ${companyId}`);

  if (!companyId) {
    console.error("[MercadoPago System Webhook] Missing external_reference (companyId)");
    return new NextResponse("Missing external_reference", { status: 400 });
  }

  if (status === "approved") {
    const companyBefore = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, subscriptionStatus: true, expiresAt: true },
    });

    const currentExpiresAt = companyBefore?.expiresAt;
    const now = new Date();
    const baseDate = currentExpiresAt && isAfter(currentExpiresAt, now) ? currentExpiresAt : now;
    const newExpiresAt = addMonths(baseDate, 1);

    const owner = await db.userCompany.findFirst({
      where: { companyId: companyId, role: "OWNER" },
      select: { userId: true, user: { select: { email: true, name: true } } },
    });

    await db.company.update({
      where: { id: companyId },
      data: {
        subscriptionStatus: SubscriptionStatus.ACTIVE,
        expiresAt: newExpiresAt,
        plan: "PRO",
        isBoletoPending: false,
      },
    });

    if (owner?.user?.email) {
      try {
        // await sendEmail({
        //   to: owner.user.email,
        //   subject: "Assinatura PRO Ativada! ✨",
        //   html: subscriptionActivatedTemplate({
        //     name: owner.user.name || "parceiro",
        //     companyName: companyBefore?.name || "sua empresa",
        //     expiryDateFormatted: format(newExpiresAt, "dd/MM/yyyy", { locale: ptBR }),
        //   }),
        // });
      } catch (_emailError) {
        // Ignored
      }
    }

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
              processedBy: "MercadoPago-Webhook",
            },
          },
        });
      }
    } catch (_auditError) {
      /* Non-critical: do not fail the webhook */
    }
  } else if (status === "rejected" || status === "cancelled") {
    const owner = await db.userCompany.findFirst({
      where: { companyId: companyId, role: "OWNER" },
      include: { user: { select: { email: true, name: true } } },
    });

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { name: true },
    });

    if (owner?.user?.email) {
      try {
        // await sendEmail({
        //   to: owner.user.email,
        //   subject: "Problema com seu pagamento ⚠️",
        //   html: paymentFailedTemplate({
        //     name: owner.user.name || "parceiro",
        //     companyName: company?.name || "sua empresa",
        //   }),
        // });
      } catch (_emailError) {
        /* Non-critical: do not fail the webhook */
      }
    }
  }

  return new NextResponse("OK", { status: 200 });
}
