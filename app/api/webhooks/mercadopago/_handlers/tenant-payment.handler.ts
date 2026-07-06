import "server-only";
import { NextResponse } from "next/server";
import { IntegrationProvider, AuditEventType } from "@prisma/client";
import { db } from "@/app/_lib/prisma";
import { broadcastEvent } from "@/app/_lib/broadcast";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { OrderService } from "@/app/_services/order";
import { MercadoPagoGateway } from "@/app/_services/payments/mercadopago-gateway";
import { PaymentEventService } from "@/app/_services/payments/payment-event.service";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { IMercadoPagoWebhookBody } from "@/app/_services/payments/types";

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
    return new NextResponse("OK", { status: 200 });
  }

  const paymentId = body.data?.id ?? body.id;
  if (!paymentId) {
    return new NextResponse("Missing payment ID", { status: 400 });
  }

  // 1. Idempotency: skip if this event was already processed
  const alreadyProcessed = await PaymentEventService.hasBeenProcessed(paymentId);
  if (alreadyProcessed) {
    console.log(`[MP Tenant] Event ${paymentId} already processed. Skipping.`);
    return new NextResponse("OK", { status: 200 });
  }

  // 2. Fetch tenant integration credentials
  const integration = await getIntegrationRawData(companyId, IntegrationProvider.MERCADOPAGO);
  if (!integration?.isEnabled || !integration.credentials?.accessToken) {
    console.error(`[MP Tenant] Integration not configured for company: ${companyId}`);
    return new NextResponse("Integration not configured", { status: 400 });
  }

  // 3. Verify payment status server-to-server with the tenant's MP account
  const gateway = new MercadoPagoGateway(integration.credentials.accessToken);
  const payment = await gateway.getPayment(paymentId);

  if (!payment) {
    return new NextResponse("Payment not found", { status: 404 });
  }

  const externalReference = payment.external_reference;
  const paymentStatus = payment.status;
  const transactionNsu = payment.id?.toString();

  if (!externalReference) {
    console.error(`[MP Tenant] Missing external_reference for payment ${paymentId}`);
    return new NextResponse("Missing external_reference", { status: 400 });
  }

  if (paymentStatus !== "approved") {
    console.log(`[MP Tenant] Payment ${transactionNsu} status: ${paymentStatus}. Skipping.`);
    return new NextResponse("OK", { status: 200 });
  }

  console.log(`[MP Tenant] Processing approved payment. external_reference: ${externalReference}`);

  try {
    // 4a. Try to resolve as a SETTLED_LATER Sale (Pagar Depois flow)
    const existingSale = await db.sale.findUnique({
      where: { id: externalReference },
      include: {
        orders: { select: { id: true, customerId: true, orderNumber: true } },
      },
    });

    if (existingSale) {
      if (existingSale.status === "ACTIVE") {
        // Already paid — idempotent response
        return new NextResponse("OK", { status: 200 });
      }

      await db.sale.update({
        where: { id: externalReference },
        data: { status: "ACTIVE", paymentMethod: "PIX" },
      });

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
      }

      await _recordAudit({ type: "SALE_UPDATED", companyId, customerId: existingSale.customerId, transactionNsu, paymentStatus, saleId: existingSale.id });
      await PaymentEventService.markAsProcessed({ id: paymentId, companyId, provider: IntegrationProvider.MERCADOPAGO, eventType: "payment.approved", payload: body as any });
      return new NextResponse("OK", { status: 200 });
    }

    // 4b. Resolve via PaymentIntent (new grouped checkout flow)
    const paymentIntent = await db.paymentIntent.findFirst({
      where: { externalId: externalReference, companyId },
    });

    const orderIdsToProcess: string[] = paymentIntent?.orderIds ?? [externalReference];

    const orders = await db.order.findMany({
      where: { id: { in: orderIdsToProcess }, companyId },
      include: {
        orderItems: { select: { unitPrice: true, quantity: true } },
      },
    });

    if (orders.length === 0) {
      return new NextResponse("Orders not found", { status: 404 });
    }

    if (orders[0].status === "PAID") {
      return new NextResponse("OK", { status: 200 });
    }

    // Calculate service tax (tip) per order
    const tipAmount = orders.reduce((sum, order) => {
      if (!order.hasServiceTax) return sum;
      const subtotal = order.orderItems.reduce(
        (s, item) => s + Number(item.unitPrice) * Number(item.quantity),
        0
      );
      return sum + Math.round(subtotal * 0.1 * 100) / 100;
    }, 0);

    console.log(`[MP Tenant] Converting ${orders.length} orders. tipAmount: R$${tipAmount.toFixed(2)}`);

    const newSale = await OrderService.convertToSale(
      orderIdsToProcess, companyId, null, "PIX",
      tipAmount, 0, 0, undefined, false, "ACTIVE", null,
      orders[0].customerId
    );

    if (paymentIntent) {
      await db.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { status: "PAID" },
      });
    }

    for (const order of orders) {
      if (order.customerId) {
        await broadcastEvent(`customer-${order.customerId}`, "order_status_update", {
          orderId: order.id,
          status: "PAID",
        });
      }
      await broadcastKdsEvent(companyId, "update_order", { id: order.id, status: "PAID" });
    }

    await _recordAudit({ type: "SALE_CREATED", companyId, customerId: orders[0].customerId, transactionNsu, paymentStatus, saleId: newSale.id });
    await PaymentEventService.markAsProcessed({ id: paymentId, companyId, provider: IntegrationProvider.MERCADOPAGO, eventType: "payment.approved", payload: body as any });

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    await PaymentEventService.markAsFailed({ id: paymentId, companyId, provider: IntegrationProvider.MERCADOPAGO, eventType: "payment.approved", payload: body as any });
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
