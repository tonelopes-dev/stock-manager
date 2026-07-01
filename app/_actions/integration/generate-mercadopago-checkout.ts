"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { IntegrationProvider } from "@prisma/client";
import { createMercadoPagoPreference } from "@/app/_lib/mercadopago";

const generateCheckoutSchema = z.object({
  orderIds: z.array(z.string()).optional(),
  saleId: z.string().min(1).optional(),
  companyId: z.string().min(1),
}).refine((data) => (data.orderIds && data.orderIds.length > 0) || data.saleId, {
  message: "É necessário informar orderIds ou saleId.",
});

export const generateMercadoPagoCheckout = actionClient
  .schema(generateCheckoutSchema)
  .action(async ({ parsedInput: { orderIds, saleId, companyId } }) => {
    // 1. Verificar integração ativa
    const integration = await getIntegrationRawData(companyId, "MERCADOPAGO" as IntegrationProvider);
    
    if (!integration || !integration.isEnabled) {
      throw new Error("O lojista não possui a integração Mercado Pago ativada no momento.");
    }

    if (!integration.credentials || !integration.credentials.accessToken) {
      throw new Error("Integração Mercado Pago configurada incorretamente (Access Token faltando).");
    }

    // 2. Resolver qual ID usar
    let resolvedId = saleId;
    let paymentAmount: number;
    let descriptionText: string;
    let customerData: { name?: string; email?: string; phone?: { area_code?: string; number?: string } } | undefined;

    if (saleId) {
      // Fluxo existente: Sale já foi criada (ex: SETTLED_LATER pelo operador)
      const sale = await db.sale.findUnique({
        where: { id: saleId, companyId },
        include: { 
          order: { select: { id: true, orderNumber: true } },
          customer: { select: { name: true, email: true, phone: true } }
        },
      });

      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status === "ACTIVE") throw new Error("Este pedido já foi pago.");

      paymentAmount = Number(sale.totalAmount);
      descriptionText = `Pedido #${sale.order?.orderNumber ?? 0}`;
      
      if (sale.customer) {
        const name = sale.customer.name;
        const email = sale.customer.email;
        if (name || email) {
          customerData = {};
          if (name) customerData.name = name;
          if (email) customerData.email = email;
        }
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
          hasServiceTax: true,
          customerId: true,
          customer: { select: { name: true, email: true, phone: true } },
          orderItems: { select: { unitPrice: true, quantity: true } },
        },
        orderBy: { createdAt: "asc" }
      });

      if (orders.length === 0) throw new Error("Nenhum pedido válido encontrado.");
      if (orders.some(o => o.status === "PAID" || o.status === "CANCELED")) {
        throw new Error("Um ou mais pedidos não estão disponíveis para pagamento.");
      }

      // Calcula o total
      paymentAmount = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);

      // Usamos o primeiro Order como ID de referência (external_reference) para o webhook.
      const mainOrderId = orders[0].id;
      
      if (orderIds.length > 1) {
        const secondaryOrderIds = orderIds.filter(id => id !== mainOrderId);
        await db.order.updateMany({
          where: { id: { in: secondaryOrderIds } },
          data: { adjustmentReason: `mercadopago_group_order:${mainOrderId}` }
        });
      }

      resolvedId = mainOrderId;
      descriptionText = orderIds.length > 1 
        ? `Comanda (${orderIds.length} pedidos)` 
        : `Pedido #${orders[0].orderNumber}`;

      if (orders[0].customer) {
        const name = orders[0].customer.name;
        const email = orders[0].customer.email;
        if (name || email) {
          customerData = {};
          if (name) customerData.name = name;
          if (email) customerData.email = email;
        }
      }

      console.log(`[MercadoPago] Link gerado usando Order ID: ${resolvedId} para ${orderIds.length} pedidos`);
    } else {
      throw new Error("Dados de pagamento insuficientes.");
    }

    if (paymentAmount <= 0) {
       throw new Error("O valor mínimo para pagamento online é inválido.");
    }

    // 3. Gerar URL de checkout via API do Mercado Pago
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { slug: true },
    });
    
    const returnUrl = `${appUrl}/${company?.slug}/my-orders`;

    const checkoutUrl = await createMercadoPagoPreference({
      accessToken: integration.credentials.accessToken,
      items: [
        {
          id: resolvedId!,
          title: descriptionText,
          quantity: 1,
          currency_id: "BRL",
          unit_price: paymentAmount,
        }
      ],
      external_reference: resolvedId!, 
      notification_url: `${appUrl}/api/webhooks/mercadopago?companyId=${companyId}`,
      back_urls: {
         success: returnUrl,
         pending: returnUrl,
         failure: returnUrl,
      },
      payer: customerData,
    });

    return { url: checkoutUrl };
  });

