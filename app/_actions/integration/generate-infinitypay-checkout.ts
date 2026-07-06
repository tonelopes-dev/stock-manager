"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { IntegrationProvider } from "@prisma/client";
import { createInfinityPayCheckout } from "@/app/_lib/infinitypay";
import { OrderService } from "@/app/_services/order";

const generateCheckoutSchema = z.object({
  orderIds: z.array(z.string()).optional(),
  saleId: z.string().min(1).optional(),
  companyId: z.string().min(1),
}).refine((data) => (data.orderIds && data.orderIds.length > 0) || data.saleId, {
  message: "É necessário informar orderIds ou saleId.",
});

export const generateInfinityPayCheckout = actionClient
  .schema(generateCheckoutSchema)
  .action(async ({ parsedInput: { orderIds, saleId, companyId } }) => {
    // 1. Verificar integração ativa
    const integration = await getIntegrationRawData(companyId, IntegrationProvider.INFINITYPAY);
    
    if (!integration || !integration.isEnabled) {
      throw new Error("O lojista não possui a integração InfinitePay ativada no momento.");
    }

    if (!integration.credentials || !integration.credentials.merchantId) {
      throw new Error("Integração InfinitePay configurada incorretamente (Handle faltando).");
    }

    // 2. Resolver qual ID usar
    let resolvedId = saleId;
    let paymentAmount: number;
    let descriptionText: string;
    let customerData: { name: string; email?: string; phone_number?: string } | undefined;

    if (saleId) {
      // Fluxo existente: Sale já foi criada (ex: SETTLED_LATER pelo operador)
      const sale = await db.sale.findUnique({
        where: { id: saleId, companyId },
        include: { 
          orders: { select: { id: true, orderNumber: true }, take: 1 },
          customer: { select: { name: true, email: true, phone: true } }
        },
      });

      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status === "ACTIVE") throw new Error("Este pedido já foi pago.");

      paymentAmount = Number(sale.totalAmount);
      descriptionText = `Pedido #${sale.orders[0]?.orderNumber ?? 0}`;
      
      if (sale.customer) {
        customerData = {
          name: sale.customer.name,
          email: sale.customer.email || undefined,
          phone_number: sale.customer.phone || undefined,
        };
      }
    } else if (orderIds && orderIds.length > 0) {
      // Novo fluxo: Agrupamento de N pedidos ativos ("Comanda") sem criar Sale prematuramente
      const orders = await db.order.findMany({
        where: { id: { in: orderIds }, companyId },
        select: { 
          id: true, 
          orderNumber: true, 
          status: true, 
          totalAmount: true,
          customerId: true,
          customer: { select: { name: true, email: true, phone: true } }
        },
        orderBy: { createdAt: "asc" }
      });

      if (orders.length === 0) throw new Error("Nenhum pedido válido encontrado.");
      if (orders.some(o => o.status === "PAID" || o.status === "CANCELED")) {
        throw new Error("Um ou mais pedidos não estão disponíveis para pagamento.");
      }

      // Calcula o total
      paymentAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      // 2. GAMBIARRA SEGURA
      // A comanda permanece em "Abertas" (Order) até ser paga pelo webhook.
      // Usamos o primeiro Order como ID de referência (order_nsu) para o webhook.
      const mainOrderId = orders[0].id;
      
      if (orderIds.length > 1) {
        const secondaryOrderIds = orderIds.filter(id => id !== mainOrderId);
        await db.order.updateMany({
          where: { id: { in: secondaryOrderIds } },
          data: { adjustmentReason: `infinitypay_group_order:${mainOrderId}` }
        });
      }

      resolvedId = mainOrderId;
      descriptionText = orderIds.length > 1 
        ? `Comanda (${orderIds.length} pedidos)` 
        : `Pedido #${orders[0].orderNumber}`;

      if (orders[0].customer) {
        customerData = {
          name: orders[0].customer.name,
          email: orders[0].customer.email || undefined,
          phone_number: orders[0].customer.phone || undefined,
        };
      }

      console.log(`[InfinityPay] Link gerado usando Order ID: ${resolvedId} para ${orderIds.length} pedidos`);
    } else {
      throw new Error("Dados de pagamento insuficientes.");
    }

    // 3. Gerar URL de checkout via API da InfinitePay
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });

    const checkoutUrl = await createInfinityPayCheckout({
      handle: integration.credentials.merchantId,
      amount: paymentAmount,
      description: descriptionText,
      order_nsu: resolvedId!, 
      webhook_url: `${appUrl}/api/webhooks/infinitypay`,
      redirect_url: `${appUrl}/${company?.slug}/my-orders`,
      customer: customerData,
    });

    return { url: checkoutUrl };
  });

