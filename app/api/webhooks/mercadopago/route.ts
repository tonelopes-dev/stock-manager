import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { IntegrationProvider, SubscriptionStatus } from "@prisma/client";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { broadcastEvent } from "@/app/_lib/broadcast";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { OrderService } from "@/app/_services/order";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { mpClient } from "@/app/_lib/mercadopago";
import { sendEmail } from "@/app/_services/email.service";
import { subscriptionActivatedTemplate, paymentFailedTemplate } from "@/app/_services/email/templates";
import { format, addMonths, isAfter } from "date-fns";
import { ptBR } from "date-fns/locale";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const tenantCompanyId = url.searchParams.get("companyId");

    const body = await req.json();
    console.log("[MercadoPago Webhook] Recebeu payload:", JSON.stringify(body));

    // Se temos tenantCompanyId na query, este é um webhook para pagamentos de pedidos/comandas de clientes (Integração Tenant)
    if (tenantCompanyId) {
      return handleTenantPaymentWebhook(tenantCompanyId, body);
    }

    // Se NÃO temos tenantCompanyId na query, este é o webhook do sistema (Assinatura Kipo Pro)
    return handleSystemSubscriptionWebhook(body, url.searchParams);

  } catch (error: any) {
    console.error("[MercadoPago Webhook] Error processing webhook:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// ------------------------------------------------------------------
// FLUXO DE PEDIDOS/COMANDAS DOS ESTABELECIMENTOS (TENANTS)
// ------------------------------------------------------------------
async function handleTenantPaymentWebhook(companyId: string, body: any) {
  if (body.type !== "payment" && body.topic !== "payment") {
    return new NextResponse("OK", { status: 200 }); // Ignora outras notificações
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return new NextResponse("Missing payment ID", { status: 400 });
  }

  // 1. Obter credenciais do MP
  const integration = await getIntegrationRawData(companyId, "MERCADOPAGO" as IntegrationProvider);
  if (!integration || !integration.isEnabled || !integration.credentials?.accessToken) {
    console.error("[MercadoPago Tenant Webhook] Integração não encontrada ou desativada para empresa:", companyId);
    return new NextResponse("Integration not configured", { status: 400 });
  }

  // 2. Buscar o status do pagamento no Mercado Pago do estabelecimento
  const client = new MercadoPagoConfig({ accessToken: integration.credentials.accessToken });
  const paymentClient = new Payment(client);
  
  const payment = await paymentClient.get({ id: paymentId });

  if (!payment) {
    return new NextResponse("Payment not found", { status: 404 });
  }

  const incomingId = payment.external_reference; // orderId ou saleId
  const status = payment.status; 
  const transaction_nsu = payment.id?.toString();
  const paid_amount = payment.transaction_amount;

  if (!incomingId) {
    console.error("[MercadoPago Tenant Webhook] Missing external_reference");
    return new NextResponse("Missing external_reference", { status: 400 });
  }

  if (status !== "approved") {
    console.log(`[MercadoPago Tenant Webhook] Transaction ${transaction_nsu} not approved. Status: ${status}`);
    return new NextResponse("OK", { status: 200 });
  }

  console.log(`[MercadoPago Tenant Webhook] Processing approved payment for ID ${incomingId}`);

  // Tenta achar como Venda
  let sale = await db.sale.findUnique({
    where: { id: incomingId },
    include: {
      order: { select: { id: true, customerId: true, companyId: true, orderNumber: true } },
      customer: { select: { id: true, name: true, email: true } },
    }
  });

  if (sale) {
    if (sale.status === "ACTIVE") {
      return new NextResponse("OK", { status: 200 });
    }

    await db.sale.update({
      where: { id: incomingId },
      data: { status: "ACTIVE", paymentMethod: "PIX" },
    });

    if (sale.order?.id) {
      await db.order.update({
        where: { id: sale.order.id },
        data: { status: "PAID" },
      });

      if (sale.order.customerId) {
        await broadcastEvent(`customer-${sale.order.customerId}`, "order_status_update", { orderId: sale.order.id, status: "PAID" });
      }
      await broadcastKdsEvent(companyId, "update_order", { orderId: sale.order.id, status: "PAID" });
    }

    const secondaryOrders = await db.order.findMany({
      where: { companyId, adjustmentReason: `mercadopago_group_sale:${incomingId}` },
      select: { id: true, customerId: true }
    });

    if (secondaryOrders.length > 0) {
      await db.order.updateMany({
        where: { id: { in: secondaryOrders.map(o => o.id) } },
        data: { status: "PAID" }
      });

      for (const order of secondaryOrders) {
        if (order.customerId) {
          await broadcastEvent(`customer-${order.customerId}`, "order_status_update", { orderId: order.id, status: "PAID" });
        }
        await broadcastKdsEvent(companyId, "update_order", { orderId: order.id, status: "PAID" });
      }
    }

    try {
      await db.auditEvent.create({
        data: {
          id: `mp-${transaction_nsu || Date.now()}`,
          type: "SALE_UPDATED",
          companyId: companyId,
          customerId: sale.customerId,
          actorName: "Mercado Pago System",
          severity: "INFO",
          metadata: { saleId: incomingId, transactionId: transaction_nsu, status, provider: "MERCADOPAGO" },
        },
      });
    } catch (e) {}

    return new NextResponse("OK", { status: 200 });
  }

  // Tenta achar como Pedido (Order)
  const mainOrder = await db.order.findUnique({
    where: { id: incomingId },
    include: { orderItems: { select: { unitPrice: true, quantity: true } } }
  });

  if (!mainOrder) {
    return new NextResponse("Not Found", { status: 404 });
  }
  if (mainOrder.status === "PAID") {
    return new NextResponse("OK", { status: 200 });
  }

  const secondaryOrders = await db.order.findMany({
    where: { companyId, adjustmentReason: `mercadopago_group_order:${incomingId}` },
    include: { orderItems: { select: { unitPrice: true, quantity: true } } }
  });

  const allRelatedOrderIds = [mainOrder.id, ...secondaryOrders.map(o => o.id)];

  // Recalcula a gorjeta (taxa de serviço de 10%) de cada pedido que tem hasServiceTax
  // O tipAmount correto é a diferença entre o totalAmount salvo e o subtotal puro dos itens.
  const allOrdersForTip = [
    mainOrder,
    ...secondaryOrders,
  ] as Array<{
    hasServiceTax: boolean;
    orderItems: Array<{ unitPrice: any; quantity: any }>;
  }>;

  const tipAmount = allOrdersForTip.reduce((sum, o) => {
    if (!o.hasServiceTax) return sum;
    const itemsSubtotal = o.orderItems.reduce(
      (s, item) => s + Number(item.unitPrice) * Number(item.quantity),
      0
    );
    return sum + Math.round(itemsSubtotal * 0.1 * 100) / 100;
  }, 0);

  console.log(`[MercadoPago Tenant Webhook] Calculated tipAmount: R$${tipAmount.toFixed(2)} for orders [${allRelatedOrderIds.join(',')}]`);

  const newSale = await OrderService.convertToSale(
    allRelatedOrderIds, companyId, null, "PIX", tipAmount, 0, 0, undefined, false, "ACTIVE", null, mainOrder.customerId
  );

  for (const orderId of allRelatedOrderIds) {
    const order = [mainOrder, ...secondaryOrders].find(o => o.id === orderId);
    if (order?.customerId) {
      await broadcastEvent(`customer-${order.customerId}`, "order_status_update", { orderId: order.id, status: "PAID" });
    }
    await broadcastKdsEvent(companyId, "update_order", { orderId: orderId, status: "PAID" });
  }

  try {
    await db.auditEvent.create({
      data: {
        id: `mp-${transaction_nsu || Date.now()}`,
        type: "SALE_CREATED",
        companyId: companyId,
        customerId: mainOrder.customerId,
        actorName: "Mercado Pago System",
        severity: "INFO",
        metadata: { saleId: newSale.id, transactionId: transaction_nsu, status, provider: "MERCADOPAGO" },
      },
    });
  } catch (e) {}

  return new NextResponse("OK", { status: 200 });
}


// ------------------------------------------------------------------
// FLUXO DE ASSINATURA DO KIPO PRO (SISTEMA)
// ------------------------------------------------------------------
async function handleSystemSubscriptionWebhook(body: any, searchParams: URLSearchParams) {
  const paymentId = body.data?.id || searchParams.get("data.id") || body.id || searchParams.get("id");
  const type = body.type || searchParams.get("type") || body.topic || searchParams.get("topic");

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
      select: { id: true, name: true, subscriptionStatus: true, expiresAt: true }
    });

    const currentExpiresAt = companyBefore?.expiresAt;
    const now = new Date();
    const baseDate = (currentExpiresAt && isAfter(currentExpiresAt, now)) ? currentExpiresAt : now;
    const newExpiresAt = addMonths(baseDate, 1);

    const owner = await db.userCompany.findFirst({
      where: { companyId: companyId, role: "OWNER" },
      select: { userId: true, user: { select: { email: true, name: true } } }
    });

    const companyAfter = await db.company.update({
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
        await sendEmail({
          to: owner.user.email,
          subject: "Assinatura PRO Ativada! ✨",
          html: subscriptionActivatedTemplate({
            name: owner.user.name || "parceiro",
            companyName: companyBefore?.name || "sua empresa",
            expiryDateFormatted: format(newExpiresAt, "dd/MM/yyyy", { locale: ptBR }),
          }),
        });
      } catch (err) {}
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
                  processedBy: "MercadoPago-Webhook"
                },
              },
            });
        }
    } catch (auditError: any) {}

  } else if (status === "rejected" || status === "cancelled") {
      const owner = await db.userCompany.findFirst({
        where: { companyId: companyId, role: "OWNER" },
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
        } catch (err) {}
      }
  }

  return new NextResponse("OK", { status: 200 });
}
