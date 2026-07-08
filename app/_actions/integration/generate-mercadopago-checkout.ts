"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
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
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { slug: true, mpMarketplaceToken: true, mpCheckoutEnabled: true },
    });
    
    if (!company) {
      throw new Error("Empresa não encontrada.");
    }

    if (!company.mpMarketplaceToken || !company.mpCheckoutEnabled) {
      throw new Error("O lojista não possui a integração Mercado Pago ativada no momento.");
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
          orders: { select: { id: true, orderNumber: true } },
          customer: { select: { name: true, email: true, phone: true } }
        },
      });

      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status === "ACTIVE") throw new Error("Este pedido já foi pago.");

      paymentAmount = Number(sale.totalAmount);
      const firstOrder = sale.orders[0];
      descriptionText = `Pedido #${firstOrder?.orderNumber ?? 0}`;
      
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

      // Apenas pegamos o mainOrderId, não atualizamos mais as orders com adjustmentReason
      // pois o PaymentIntent fará o agrupamento.
      const mainOrderId = orders[0].id;

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
    let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Remove any accidental quotes or trailing slashes
    appUrl = appUrl.replace(/['"]/g, '').replace(/\/$/, '').trim();

    const returnUrl = `${appUrl}/${company.slug}/my-orders`;
    console.log("[MercadoPago] URLs configuradas:", { appUrl, returnUrl });

    // 3.5. Criar o PaymentIntent antes de chamar o MP para ter o ID
    const paymentIntent = await db.paymentIntent.create({
      data: {
        companyId,
        orderIds: saleId ? [] : orderIds,
        amount: paymentAmount,
        provider: "MERCADOPAGO",
      }
    });

    const preferenceResult = await createMercadoPagoPreference({
      accessToken: company.mpMarketplaceToken,
      items: [
        {
          id: resolvedId!,
          title: descriptionText,
          quantity: 1,
          currency_id: "BRL",
          unit_price: paymentAmount,
        }
      ],
      external_reference: paymentIntent.id, 
      notification_url: `${appUrl}/api/webhooks/mercadopago?companyId=${companyId}`,
      back_urls: {
         success: returnUrl,
         pending: returnUrl,
         failure: returnUrl,
      },
      payer: customerData,
    });

    // 4. Atualizar o PaymentIntent com o ID da preference para que a tela de pagamento consiga encontrá-lo
    await db.paymentIntent.update({
      where: { id: paymentIntent.id },
      data: { externalId: preferenceResult.id }
    });

    return { 
      url: preferenceResult.url, 
      preferenceId: preferenceResult.id 
    };
  });

