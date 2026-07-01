import { db } from "@/app/_lib/prisma";
import { NextResponse } from "next/server";
import { IntegrationProvider } from "@prisma/client";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { broadcastEvent } from "@/app/_lib/broadcast";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";

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

    // 1. Extrair os dados conforme documentação (order_nsu é o nosso Sale ID)
    const { order_nsu, transaction_nsu, status, capture_method, paid_amount } = body;
    const saleId = order_nsu;

    if (!saleId) {
      console.error("[InfinityPay Webhook] Missing order_nsu (saleId)");
      return new NextResponse("Missing order_nsu", { status: 400 });
    }

    // 2. Buscar a venda para saber de qual loja (tenant) ela é
    const sale = await db.sale.findUnique({
      where: { id: saleId },
      include: {
        order: { select: { id: true, customerId: true, companyId: true, orderNumber: true } },
        customer: { select: { id: true, name: true, email: true } },
      }
    });

    if (!sale) {
      console.error(`[InfinityPay Webhook] Sale ${saleId} not found`);
      return new NextResponse("Sale not found", { status: 404 });
    }
    
    // Evita processamento duplicado, conforme documentação "Se já estiver PAID, ignorar"
    if (sale.status === "ACTIVE") {
      console.log(`[InfinityPay Webhook] Sale ${saleId} is already PAID. Ignoring.`);
      return new NextResponse("OK", { status: 200 });
    }

    const companyId = sale.companyId;

    console.log(`[InfinityPay Webhook] Processing payment for sale ${saleId}, transaction: ${transaction_nsu}`);

    // Em webhooks gerados pelo "InfinitePay Checkout Links", o pagamento bate quando já foi feito.
    // Vamos tratar "status === 'approved' ou 'paid'" se eles enviarem, 
    // mas muitas vezes webhooks só vêm quando o pagamento foi confirmado. 
    // Assumimos confirmado. Se enviarem status, checamos.
    const isApproved = status ? (status === "approved" || status === "paid") : true;

    // 5. Processar o pagamento aprovado
    if (isApproved) {
      // 5.1 Atualiza Sale
      await db.sale.update({
        where: { id: saleId },
        data: { 
          status: "ACTIVE",
          paymentMethod: "PIX" // Supondo PIX. A InfinityPay envia o método no payload, pode ser mapeado se necessário.
        },
      });

      // 5.2 Atualiza Order (O principal que está nativamente vinculado à Sale)
      if (sale.order?.id) {
        await db.order.update({
          where: { id: sale.order.id },
          data: { status: "PAID" },
        });

        // 5.3 Emite Broadcast para o cliente e para o KDS (Tempo Real)
        if (sale.order.customerId) {
          // Atualiza a tela do cliente
          await broadcastEvent(
            `customer-${sale.order.customerId}`,
            "order_status_update",
            { orderId: sale.order.id, status: "PAID" }
          );
        }
        
        // Atualiza a tela da cozinha/PDV
        await broadcastKdsEvent(
          companyId,
          "update_order",
          { orderId: sale.order.id, status: "PAID" }
        );
      }

      // 5.2.2 GAMBIARRA SEGURA: Atualiza pedidos secundários agrupados na mesma Comanda
      // (Ver docs/tech-debt.md)
      const secondaryOrders = await db.order.findMany({
        where: { companyId, adjustmentReason: `infinitypay_group_sale:${saleId}` },
        select: { id: true, customerId: true }
      });

      if (secondaryOrders.length > 0) {
        await db.order.updateMany({
          where: { id: { in: secondaryOrders.map(o => o.id) } },
          data: { status: "PAID" }
        });

        // Emite broadcast para os pedidos secundários
        for (const order of secondaryOrders) {
          if (order.customerId) {
            await broadcastEvent(`customer-${order.customerId}`, "order_status_update", { orderId: order.id, status: "PAID" });
          }
          await broadcastKdsEvent(companyId, "update_order", { orderId: order.id, status: "PAID" });
        }
        console.log(`[InfinityPay Webhook] ${secondaryOrders.length} pedidos secundários marcados como pagos para Sale ${saleId}`);
      }

      // 5.4 Auditoria
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
              saleId,
              orderId: sale.order?.id,
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
    }

    return new NextResponse("OK", { status: 200 });
  } catch (error: any) {
    console.error("[InfinityPay Webhook] Error processing webhook:", error.message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
