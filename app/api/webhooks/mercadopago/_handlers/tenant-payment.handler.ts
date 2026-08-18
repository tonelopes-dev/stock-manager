import { broadcastEvent } from "@/app/_lib/broadcast";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { db } from "@/app/_lib/prisma";
import { MercadoPagoGateway } from "@/app/_services/payments/mercadopago-gateway";
import { PaymentCompletionService } from "@/app/_services/payments/payment-completion.service";
import { PaymentEventService } from "@/app/_services/payments/payment-event.service";
import { IMercadoPagoWebhookBody } from "@/app/_services/payments/types";
import { AuditEventType } from "@prisma/client";
import { NextResponse } from "next/server";
import "server-only";

const LOG = "[MP:Webhook]";

/**
 * Tenant Payment Webhook Handler
 *
 * Single Responsibility: process approved payments for tenant comandas/orders.
 * This handler is invoked when a tenant's customer pays a comanda online.
 *
 * Flow:
 *  1. Validate webhook and extract payment ID
 *  2. Check idempotency (skip if already processed)
 *  3. Fetch payment status from MP using tenant's own access token
 *  4. Resolve the target: a SETTLED_LATER Sale OR a group of Orders via PaymentIntent
 *  5. Mark orders as PAID and broadcast real-time events
 */
export async function handleTenantPaymentWebhook(
  companyId: string,
  body: IMercadoPagoWebhookBody
): Promise<NextResponse> {
  if (body.type !== "payment" && body.topic !== "payment") {
    console.log(`${LOG} Ignoring non-payment event: type=${body.type} topic=${body.topic}`);
    return new NextResponse("OK", { status: 200 });
  }

  let resourceId = body.resource;
  if (typeof resourceId === 'string' && resourceId.includes('/')) {
    resourceId = resourceId.split('/').pop();
  }
  
  const paymentId = body.data?.id ?? body.id ?? resourceId;
  console.log(`${LOG} ─────────────────────────────────────────`);
  console.log(`${LOG} Received payment event. paymentId=${paymentId} companyId=${companyId}`);

  if (!paymentId) {
    console.error(`${LOG} ❌ Missing payment ID in body:`, JSON.stringify(body));
    return new NextResponse("Missing payment ID", { status: 400 });
  }

  // 1. Idempotency: skip if this event was already processed
  const alreadyProcessed = await PaymentEventService.hasBeenProcessed(paymentId);
  if (alreadyProcessed) {
    console.log(`${LOG} Event ${paymentId} already processed. Skipping.`);
    return new NextResponse("OK", { status: 200 });
  }

  // 2. Fetch tenant integration credentials
  const company = await db.company.findUnique({
    where: { id: companyId },
    select: { mpMarketplaceToken: true, mpCheckoutEnabled: true, kipoMarketplaceFeeRate: true },
  });
  
  if (!company || !company.mpMarketplaceToken || !company.mpCheckoutEnabled) {
    console.error(`${LOG} ❌ Integration not configured for company: ${companyId}`);
    return new NextResponse("Integration not configured", { status: 400 });
  }

  // 3. Verify payment status server-to-server with the tenant's MP account
  const gateway = new MercadoPagoGateway(company.mpMarketplaceToken);
  const payment = await gateway.getPayment(paymentId);

  if (!payment) {
    console.error(`${LOG} ❌ Payment ${paymentId} not found in MP API`);
    return new NextResponse("Payment not found", { status: 404 });
  }

  const externalReference = payment.external_reference;
  const paymentStatus = payment.status;
  const transactionNsu = payment.id?.toString();

  console.log(`${LOG} MP payment details: id=${transactionNsu} status=${paymentStatus} external_reference=${externalReference}`);

  if (!externalReference) {
    console.error(`${LOG} ❌ Missing external_reference for payment ${paymentId}`);
    return new NextResponse("Missing external_reference", { status: 400 });
  }

  if (paymentStatus === "charged_back" || paymentStatus === "refunded" || paymentStatus === "cancelled") {
    console.log(`${LOG} ⚠️ Negative payment status detected: ${paymentStatus}. Initiating reversal.`);
    
    // 1. Encontrar a Venda (Sale) associada
    const saleToReverse = await db.sale.findFirst({
      where: { 
        OR: [
          { id: externalReference }, // Fluxo Pagar Depois (external_reference é a Sale)
          { externalPaymentId: paymentId.toString() } // Fluxo Checkout (Sale é criada e recebe o ID do pagamento)
        ],
        companyId 
      },
      include: { orders: { select: { id: true, customerId: true } } }
    });

    if (!saleToReverse) {
      console.warn(`${LOG} No Sale found to reverse for payment ${paymentId}. Skipping.`);
      return new NextResponse("OK", { status: 200 });
    }

    // 2. Atualizar status no banco e zerar taxa da plataforma para não faturar o restaurante
    await db.$transaction(async (tx) => {
      await tx.sale.update({
        where: { id: saleToReverse.id },
        data: { 
          status: "CANCELED",
          platformFeeAmount: 0,
          netAmount: 0
        }
      });

      if (saleToReverse.orders.length > 0) {
        await tx.order.updateMany({
          where: { id: { in: saleToReverse.orders.map(o => o.id) } },
          data: { status: "CANCELED" }
        });
      }
    });

    // 3. Trilha de Auditoria (Audit Trail) e Notificação em Tempo Real
    await _recordAudit({ 
      type: "SALE_CANCELED", 
      companyId, 
      customerId: saleToReverse.customerId, 
      transactionNsu, 
      paymentStatus, 
      saleId: saleToReverse.id 
    });

    for (const order of saleToReverse.orders) {
      if (order.customerId) {
        await broadcastEvent(`customer-${order.customerId}`, "order_status_update", {
          orderId: order.id,
          status: "CANCELED",
        });
      }
      await broadcastKdsEvent(companyId, "update_order", { id: order.id, status: "CANCELED" });
    }

    console.log(`${LOG} ✅ Reversal complete. Sale ${saleToReverse.id} marked as CANCELED. Events broadcast.`);
    await PaymentEventService.markAsProcessed({ id: paymentId, companyId, provider: "MERCADOPAGO", eventType: `payment.${paymentStatus}`, payload: body as any });
    return new NextResponse("OK", { status: 200 });
  }

  if (paymentStatus !== "approved") {
    console.log(`${LOG} Payment ${transactionNsu} status is '${paymentStatus}' — not approved or reversed, skipping.`);
    return new NextResponse("OK", { status: 200 });
  }

  console.log(`${LOG} ✅ Payment approved. Processing external_reference=${externalReference}`);

  try {
    // 4a. Try to resolve as a SETTLED_LATER Sale (Pagar Depois flow)
    console.log(`${LOG} 4a. Looking up existing Sale with id='${externalReference}'`);
    const existingSale = await db.sale.findUnique({
      where: { id: externalReference },
      include: {
        orders: { select: { id: true, customerId: true, orderNumber: true } },
      },
    });

    if (existingSale) {
      console.log(`${LOG} Found existing Sale id=${existingSale.id} status=${existingSale.status}`);
      if (existingSale.status === "ACTIVE") {
        console.log(`${LOG} Sale already ACTIVE — idempotent skip.`);
        return new NextResponse("OK", { status: 200 });
      }

      await db.sale.update({
        where: { id: externalReference },
        data: { status: "ACTIVE", paymentMethod: "PIX" },
      });
      console.log(`${LOG} ✅ Sale ${existingSale.id} updated to ACTIVE.`);

      if (existingSale.orders.length > 0) {
        await db.order.updateMany({
          where: { id: { in: existingSale.orders.map((o) => o.id) } },
          data: { status: "PAID" },
        });

        for (const order of existingSale.orders) {
          if (order.customerId) {
            await broadcastEvent(`customer-${order.customerId}`, "order_status_update", {
              orderId: order.id,
              status: "PAID",
            });
          }
          await broadcastKdsEvent(companyId, "update_order", { id: order.id, status: "PAID" });
        }
        console.log(`${LOG} ✅ ${existingSale.orders.length} order(s) marked PAID and events broadcast.`);
      }

      await _recordAudit({ type: "SALE_UPDATED", companyId, customerId: existingSale.customerId, transactionNsu, paymentStatus, saleId: existingSale.id });
      await PaymentEventService.markAsProcessed({ id: paymentId, companyId, provider: "MERCADOPAGO", eventType: "payment.approved", payload: body as any });
      console.log(`${LOG} ─────────────────────────────────────────`);
      return new NextResponse("OK", { status: 200 });
    }

    // 4b. Resolve via PaymentIntent (new grouped checkout flow)
    console.log(`${LOG} 4b. No Sale found. Looking up PaymentIntent with id='${externalReference}'`);
    const paymentIntent = await db.paymentIntent.findFirst({
      where: { id: externalReference, companyId },
    });
    console.log(`${LOG} PaymentIntent lookup:`, paymentIntent ? `FOUND orderIds=${JSON.stringify(paymentIntent.orderIds)} status=${paymentIntent.status}` : "NOT FOUND");

    const orderIdsToProcess: string[] = paymentIntent?.orderIds ?? [externalReference];
    console.log(`${LOG} orderIdsToProcess:`, orderIdsToProcess);

    const orders = await db.order.findMany({
      where: { id: { in: orderIdsToProcess }, companyId },
      include: {
        orderItems: { select: { unitPrice: true, quantity: true } },
      },
    });
    console.log(`${LOG} Found ${orders.length} order(s). Statuses:`, orders.map(o => o.status));

    if (orders.length === 0) {
      console.error(`${LOG} ❌ No orders found for ids:`, orderIdsToProcess);
      return new NextResponse("Orders not found", { status: 404 });
    }

    if (orders[0].status === "PAID") {
      console.log(`${LOG} Orders already PAID — idempotent skip.`);
      return new NextResponse("OK", { status: 200 });
    }

    console.log(`${LOG} Delegating to PaymentCompletionService for ${orders.length} order(s)`);

    const configuredFeeRate = Number(company.kipoMarketplaceFeeRate ?? 0.01);
    const paymentAmountCents = Math.round(Number(payment.transaction_amount || 0) * 100);
    
    const expectedPlatformFeeCents = Math.round(paymentAmountCents * configuredFeeRate);
    const expectedNetAmountCents = paymentAmountCents - expectedPlatformFeeCents;
    
    const expectedPlatformFeeAmount = expectedPlatformFeeCents / 100;
    const expectedNetAmount = expectedNetAmountCents / 100;

    const newSale = await PaymentCompletionService.completeOnlinePayment({
      orderIds: orderIdsToProcess,
      companyId,
      paymentMethod: "PIX",
      customerId: orders[0].customerId,
      orders: orders.map(o => ({
        id: o.id,
        customerId: o.customerId,
        hasServiceTax: o.hasServiceTax,
        orderItems: o.orderItems,
      })),
      platformFeeRate: configuredFeeRate,
      platformFeeAmount: expectedPlatformFeeAmount, // Mantemos o registro para faturamento posterior
      netAmount: expectedNetAmount,
      externalPaymentId: paymentId.toString(),
      paymentProvider: "MERCADOPAGO",
    });

    if (paymentIntent) {
      await db.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: "PAID" },
      });
      console.log(`${LOG} ✅ PaymentIntent ${paymentIntent.id} marked as PAID.`);
    }

    await _recordAudit({ type: "SALE_CREATED", companyId, customerId: orders[0].customerId, transactionNsu, paymentStatus, saleId: newSale.id });
    await PaymentEventService.markAsProcessed({ id: paymentId, companyId, provider: "MERCADOPAGO", eventType: "payment.approved", payload: body as any });
    console.log(`${LOG} ─────────────────────────────────────────`);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error(`${LOG} ❌ Unhandled error:`, error);
    await PaymentEventService.markAsFailed({ id: paymentId, companyId, provider: "MERCADOPAGO", eventType: "payment.approved", payload: body as any });
    throw error;
  }
}

// ─── Private helpers ────────────────────────────────────────────────────────

async function _recordAudit({
  type, companyId, customerId, transactionNsu, paymentStatus, saleId,
}: {
  type: AuditEventType;
  companyId: string;
  customerId: string | null | undefined;
  transactionNsu: string | undefined;
  paymentStatus: string;
  saleId: string;
}) {
  try {
    await db.auditEvent.create({
      data: {
        id: `mp-${transactionNsu ?? Date.now()}`,
        type,
        companyId,
        customerId,
        actorName: "Mercado Pago System",
        severity: "INFO",
        metadata: { saleId, transactionId: transactionNsu, status: paymentStatus, provider: "MERCADOPAGO" },
      },
    });
  } catch (_auditError) {
    /* Non-critical: do not fail the webhook if audit logging fails */
  }
}
