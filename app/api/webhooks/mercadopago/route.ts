import { mpClient } from "@/app/_lib/mercadopago";
import { Payment } from "mercadopago";
import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SubscriptionStatus = {
  ACTIVE: "ACTIVE",
  PAST_DUE: "PAST_DUE",
  CANCELED: "CANCELED",
} as const;

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
      // Set expiration to 30 days from now
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      // Resolve company owner for AuditEvent (actorId is mandatory)
      const owner = await db.userCompany.findFirst({
        where: { 
            companyId: companyId,
            role: "OWNER"
        },
        select: { userId: true, user: { select: { email: true, name: true } } }
      });

      const actorId = owner?.userId || "SYSTEM"; // Fallback if no owner (shouldn't happen)

      await db.company.update({
        where: { id: companyId },
        data: {
          subscriptionStatus: SubscriptionStatus.ACTIVE,
          stripeCurrentPeriodEnd: thirtyDaysFromNow,
          plan: "PRO",
          isBoletoPending: false,
        },
      });

      // Log audit event
      await db.auditEvent.create({
        data: {
          id: `mp-sub-${paymentId}`,
          type: "SUBSCRIPTION_ACTIVATED",
          companyId: companyId,
          actorId: actorId, 
          actorEmail: owner?.user?.email || paymentData.payer?.email || "system@mercadopago.com",
          actorName: owner?.user?.name || "Mercado Pago System",
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

      console.log(`[MercadoPago Webhook] ✅ Subscription activated for company ${companyId}`);
    } else if (status === "rejected" || status === "cancelled") {
        // Optional: handle rejection/cancellation if needed
        console.warn(`[MercadoPago Webhook] ⚠️ Payment ${paymentId} was ${status}`);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[MercadoPago Webhook] Error processing webhook:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
