import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { IntegrationProvider } from "@prisma/client";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { broadcastEvent } from "@/app/_lib/broadcast";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { OrderService } from "@/app/_services/order";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    console.log("[InfinityPay Webhook] Recebeu payload (raw):", rawBody);

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new NextResponse("Invalid JSON", { status: 400 });
    }

    // 1. Extrair os dados conforme documentação
    const { order_nsu, transaction_nsu, status, capture_method, paid_amount } = body;
    const incomingId = order_nsu; // Pode ser Sale ID ou Order ID

    if (!incomingId) {
      console.error("[InfinityPay Webhook] Missing order_nsu (incomingId)");
      return new NextResponse("Missing order_nsu", { status: 400 });
    }

    const isApproved = status ? (status === "approved" || status === "paid") : true;

    if (!isApproved) {
      console.log(`[InfinityPay Webhook] Transaction ${transaction_nsu} not approved. Status: ${status}`);
      return new NextResponse("OK", { status: 200 });
    }

    console.log(`[InfinityPay Webhook] Processing approved payment for ID ${incomingId}, transaction: ${transaction_nsu}`);

    // 2. Tenta achar como Venda (fluxo antigo ou checkout de algo que já estava A Pagar)
    let sale = await db.sale.findUnique({
      where: { id: incomingId },
      include: {
        orders: { select: { id: true, customerId: true, companyId: true, orderNumber: true } },
        customer: { select: { id: true, name: true, email: true } },
      }
    });

    if (sale) {
      // É uma SALE
      if (sale.status === "ACTIVE") {
        console.log(`[InfinityPay Webhook] Sale ${incomingId} is already PAID. Ignoring.`);
        return new NextResponse("OK", { status: 200 });
      }

      const companyId = sale.companyId;

      // Atualiza Sale
      await db.sale.update({
        where: { id: incomingId },
        data: { 
          status: "ACTIVE",
          paymentMethod: "PIX" 
        },
      });

      // Atualiza Orders principais
      if (sale.orders && sale.orders.length > 0) {
        const orderId = sale.orders[0].id;
        const customerId = sale.orders[0].customerId;
        await db.order.update({
          where: { id: orderId },
          data: { status: "PAID" },
        });

        if (customerId) {
          await broadcastEvent(
            `customer-${customerId}`,
            "order_status_update",
            { orderId: orderId, status: "PAID" }
          );
        }
        
        await broadcastKdsEvent(companyId, "update_order", { orderId: orderId, status: "PAID" });
      }

      // Atualiza pedidos secundários (Gambiarra Segura para Sale)
      const secondaryOrders = await db.order.findMany({
        where: { companyId, adjustmentReason: `infinitypay_group_sale:${incomingId}` },
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

      // Auditoria
      try {
        await db.auditEvent.create({
          data: {
            id: `ifp-${transaction_nsu || Date.now()}`,
            type: "SALE_UPDATED",
            companyId: companyId,
            customerId: sale.customerId,
            actorName: "InfinityPay System",
            severity: "INFO",
            metadata: {
              saleId: incomingId,
              orderId: sale.orders && sale.orders.length > 0 ? sale.orders[0].id : undefined,
              transactionId: transaction_nsu,
              status: status || "approved",
              amount: paid_amount || Number(sale.totalAmount),
              provider: "INFINITYPAY"
            },
          },
        });
      } catch (auditError) {
        console.warn("[InfinityPay Webhook] Failed to log AuditEvent", auditError);
      }

      return new NextResponse("OK", { status: 200 });
    }

    // 3. Se não achou Sale, tenta achar como Pedido (Order) - NOVO FLUXO
    const mainOrder = await db.order.findUnique({
      where: { id: incomingId }
    });

    if (!mainOrder) {
      console.error(`[InfinityPay Webhook] Target ${incomingId} not found as Sale or Order`);
      return new NextResponse("Not Found", { status: 404 });
    }

    if (mainOrder.status === "PAID") {
      console.log(`[InfinityPay Webhook] Order ${incomingId} is already PAID. Ignoring.`);
      return new NextResponse("OK", { status: 200 });
    }

    const companyId = mainOrder.companyId;

    // Acha os pedidos secundários agrupados
    const secondaryOrders = await db.order.findMany({
      where: { companyId, adjustmentReason: `infinitypay_group_order:${incomingId}` }
    });

    const allRelatedOrderIds = [mainOrder.id, ...secondaryOrders.map(o => o.id)];

    // Converte os pedidos em uma nova Venda, que os marca como PAID automaticamente
    const newSale = await OrderService.convertToSale(
      allRelatedOrderIds,
      companyId,
      null,
      "PIX", 
      0, 0, 0, undefined, false,
      "ACTIVE", 
      null,
      mainOrder.customerId
    );

    console.log(`[InfinityPay Webhook] Converted Orders [${allRelatedOrderIds.join(',')}] to Sale ${newSale.id}`);

    // Emite broadcast para atualizar os clientes e o KDS
    for (const orderId of allRelatedOrderIds) {
      const order = [mainOrder, ...secondaryOrders].find(o => o.id === orderId);
      if (order?.customerId) {
        await broadcastEvent(`customer-${order.customerId}`, "order_status_update", { orderId: order.id, status: "PAID" });
      }
      await broadcastKdsEvent(companyId, "update_order", { orderId: orderId, status: "PAID" });
    }

    // Auditoria
    try {
      await db.auditEvent.create({
        data: {
          id: `ifp-${transaction_nsu || Date.now()}`,
          type: "SALE_CREATED",
          companyId: companyId,
          customerId: mainOrder.customerId,
          actorName: "InfinityPay System",
          severity: "INFO",
          metadata: {
            saleId: newSale.id,
            orderIds: allRelatedOrderIds,
            transactionId: transaction_nsu,
            status: status || "approved",
            amount: paid_amount || Number(newSale.totalAmount),
            provider: "INFINITYPAY"
          },
        },
      });
    } catch (auditError) {
      console.warn("[InfinityPay Webhook] Failed to log AuditEvent for new Sale", auditError);
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[InfinityPay Webhook] Error processing webhook:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

