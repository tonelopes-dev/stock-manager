"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { db } from "@/app/_lib/prisma";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { IntegrationProvider } from "@prisma/client";
import { MercadoPagoGateway } from "@/app/_services/payments/mercadopago-gateway";
import { assertCapability } from "@/app/_lib/rbac";

const generatePixPaymentSchema = z.object({
  orderIds: z.array(z.string()).optional(),
  saleId: z.string().min(1).optional(),
  companyId: z.string().min(1),
}).refine((data) => (data.orderIds && data.orderIds.length > 0) || data.saleId, {
  message: "É necessário informar orderIds ou saleId.",
});

export const generatePixPayment = actionClient
  .schema(generatePixPaymentSchema)
  .action(async ({ parsedInput: { orderIds, saleId, companyId } }) => {
    // 1. Verificações de permissão
    await assertCapability("sale:process");

    // 2. Verificar integração ativa
    const integration = await getIntegrationRawData(companyId, "MERCADOPAGO" as IntegrationProvider);
    
    if (!integration || !integration.isEnabled) {
      throw new Error("O estabelecimento não possui a integração Mercado Pago ativada no momento.");
    }

    if (!integration.credentials || !integration.credentials.accessToken) {
      throw new Error("Integração Mercado Pago configurada incorretamente (Access Token faltando).");
    }

    // 3. Resolver pedidos e valores (Mesma lógica do generateCheckout)
    let resolvedId = saleId;
    let paymentAmount: number = 0;
    let descriptionText: string = "";

    if (saleId) {
      const sale = await db.sale.findUnique({
        where: { id: saleId, companyId },
        include: { orders: { select: { id: true, orderNumber: true }, take: 1 } },
      });

      if (!sale) throw new Error("Venda não encontrada.");
      if (sale.status === "ACTIVE") throw new Error("Esta venda já foi paga.");

      paymentAmount = Number(sale.totalAmount);
      descriptionText = `Pedido #${sale.orders[0]?.orderNumber ?? 0}`;
    } else if (orderIds && orderIds.length > 0) {
      const orders = await db.order.findMany({
        where: { id: { in: orderIds }, companyId },
        select: { id: true, orderNumber: true, status: true, totalAmount: true },
      });

      if (orders.length === 0) throw new Error("Pedidos não encontrados.");

      const isAnyPaid = orders.some((o) => o.status === "PAID");
      if (isAnyPaid) {
        throw new Error("Um ou mais pedidos já estão pagos.");
      }

      paymentAmount = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);

      // Apenas pegamos o mainOrderId. O agrupamento será feito via PaymentIntent.
      const mainOrderId = orders[0].id;

      resolvedId = mainOrderId;
      descriptionText = orderIds.length > 1 
        ? `Comanda (${orderIds.length} pedidos)` 
        : `Pedido #${orders[0].orderNumber}`;
    } else {
      throw new Error("Dados de pagamento insuficientes.");
    }

    if (paymentAmount <= 0) {
       throw new Error("O valor para gerar Pix deve ser maior que zero.");
    }

    // 4. Criar PaymentIntent
    const paymentIntent = await db.paymentIntent.create({
      data: {
        companyId,
        orderIds: saleId ? [] : orderIds,
        amount: paymentAmount,
        provider: "MERCADOPAGO",
      }
    });

    // 5. Gerar PIX
    const gateway = new MercadoPagoGateway(integration.credentials.accessToken);
    const pixResult = await gateway.generateDynamicPix(paymentAmount, descriptionText, paymentIntent.id);

    // 6. Opcional: Atualizar externalId se o Gateway retornar o ID do pagamento PIX
    if (pixResult.externalId) {
      await db.paymentIntent.update({
        where: { id: paymentIntent.id },
        data: { externalId: pixResult.externalId.toString() }
      });
    }

    return pixResult; // { qrCodeBase64, copyPasteCode, externalId }
  });
