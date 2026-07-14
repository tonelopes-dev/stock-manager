"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { MercadoPagoGateway } from "@/app/_services/payments/mercadopago-gateway";

import { db } from "@/app/_lib/prisma";
import { PaymentCompletionService } from "@/app/_services/payments/payment-completion.service";

const LOG = "[MP:Bricks]";

const processTransparentPaymentSchema = z.object({
  companyId: z.string(),
  preferenceId: z.string(),
  bricksPayload: z.any(), // Raw payload from Mercado Pago Bricks onSubmit callback
});

function translateMercadoPagoError(statusDetail: string): string {
  const errorMap: Record<string, string> = {
    cc_rejected_bad_filled_card_number: "Revise o número do cartão.",
    cc_rejected_bad_filled_date: "Revise a data de validade.",
    cc_rejected_bad_filled_other: "Revise os dados do cartão.",
    cc_rejected_bad_filled_security_code: "Revise o código de segurança do cartão.",
    cc_rejected_blacklist: "Não pudemos processar seu pagamento.",
    cc_rejected_call_for_authorize: "Você deve autorizar o pagamento junto ao emissor do seu cartão.",
    cc_rejected_card_disabled: "Ligue para o emissor do seu cartão para ativar seu cartão.",
    cc_rejected_card_error: "Não conseguimos processar seu pagamento.",
    cc_rejected_duplicated_payment: "Você já efetuou um pagamento com esse valor.",
    cc_rejected_high_risk: "Seu pagamento foi recusado por segurança.",
    cc_rejected_insufficient_amount: "Seu cartão não possui saldo suficiente.",
    cc_rejected_invalid_installments: "O emissor do seu cartão não processa pagamentos na quantidade de parcelas escolhida.",
    cc_rejected_max_attempts: "Você atingiu o limite de tentativas permitido.",
    cc_rejected_other_reason: "O emissor do seu cartão não autorizou o pagamento.",
  };

  return errorMap[statusDetail] || "Pagamento não aprovado. Verifique os dados ou tente outro cartão.";
}

/**
 * Extracts the actual payment API payload from the Bricks SDK wrapper.
 *
 * The Bricks onSubmit sends a WRAPPER object:
 *   { paymentType, selectedPaymentMethod, formData: { <actual API fields> } }
 *
 * The Mercado Pago Payments API only accepts the INNER fields.
 * This function safely unwraps the payload regardless of payment type.
 */
function extractMPApiPayload(rawBricksPayload: unknown): Record<string, unknown> {
  if (typeof rawBricksPayload !== "object" || rawBricksPayload === null) {
    console.warn(`${LOG} extractMPApiPayload received non-object:`, typeof rawBricksPayload);
    return {};
  }

  const outer = rawBricksPayload as Record<string, unknown>;
  const paymentType = outer.paymentType as string | undefined;
  const inner = outer.formData;

  console.log(`${LOG} Bricks payload outer keys:`, Object.keys(outer));
  console.log(`${LOG} paymentType:`, paymentType);
  console.log(`${LOG} inner formData type:`, typeof inner);
  console.log(`${LOG} inner formData is object:`, typeof inner === "object" && inner !== null);

  // If the outer object has 'paymentType' it IS the Bricks wrapper → use inner formData
  if (paymentType !== undefined && typeof inner === "object" && inner !== null) {
    const innerFields = inner as Record<string, unknown>;
    console.log(`${LOG} Unwrapped inner formData keys:`, Object.keys(innerFields));
    return innerFields;
  }

  // Fallback: payload is already the raw API payload (no wrapper)
  console.warn(`${LOG} Could not detect Bricks wrapper — using raw payload as-is. Keys:`, Object.keys(outer));
  return outer;
}

export const processTransparentPayment = actionClient
  .schema(processTransparentPaymentSchema)
  .action(async ({ parsedInput: { companyId, preferenceId, bricksPayload } }) => {
    console.log(`${LOG} ─────────────────────────────────────────`);
    console.log(`${LOG} processTransparentPayment called`);
    console.log(`${LOG} companyId: ${companyId}`);
    console.log(`${LOG} preferenceId: ${preferenceId}`);

    try {
      // 1. Pega o Access Token do lojista
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: { mpMarketplaceToken: true, mpCheckoutEnabled: true, kipoMarketplaceFeeRate: true },
      });
      if (!company || !company.mpMarketplaceToken || !company.mpCheckoutEnabled) {
        throw new Error("Integração do Mercado Pago não configurada para este estabelecimento.");
      }
      console.log(`${LOG} ✅ Integration found and enabled`);

      // 2. Busca a intenção de pagamento pelo externalId (= preferenceId gerado pelo MP)
      const paymentIntent = await db.paymentIntent.findFirst({
        where: { externalId: preferenceId, companyId },
      });

      console.log(`${LOG} PaymentIntent lookup by externalId='${preferenceId}':`, paymentIntent ? `FOUND id=${paymentIntent.id} status=${paymentIntent.status} amount=${paymentIntent.amount}` : "NOT FOUND");

      if (!paymentIntent) {
        throw new Error("Intenção de pagamento não encontrada ou inválida.");
      }

      // 3. Extrai o payload correto para a API do MP
      const innerFormData = extractMPApiPayload(bricksPayload);

      // Validação de segurança: o valor do Bricks deve bater com o do PaymentIntent (tolerância de R$ 0,01)
      // IMPORTANTE: NÃO sobrescrevemos transaction_amount — o token do cartão é gerado pelo Bricks
      // vinculado ao amount exato da inicialização. Qualquer diferença invalida o token (erro 2131).
      const bricksAmount = Number(innerFormData.transaction_amount);
      const intentAmount = Number(paymentIntent.amount);
      const amountDiff = Math.abs(bricksAmount - intentAmount);

      console.log(`${LOG} Amount validation: bricks=${bricksAmount} intent=${intentAmount} diff=${amountDiff.toFixed(4)}`);

      if (amountDiff > 0.02) {
        console.error(`${LOG} ❌ Amount mismatch too large — possible tampering. Aborting.`);
        throw new Error("Valor de pagamento inconsistente. Por favor, recarregue a página e tente novamente.");
      }

      let appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      appUrl = appUrl.replace(/['"]/g, '').replace(/\/$/, '').trim();

      const platformFeeRate = Number(company.kipoMarketplaceFeeRate ?? 0.01);
      const platformFeeAmount = Math.round(bricksAmount * platformFeeRate * 100) / 100;
      const netAmount = bricksAmount - platformFeeAmount;

      const finalPayload = {
        ...innerFormData,
        // Usamos o transaction_amount do Bricks (vinculado ao token do cartão)
        external_reference: paymentIntent.id,
        description: "Pagamento de comanda",
        notification_url: `${appUrl}/api/webhooks/mercadopago?companyId=${companyId}`,
        application_fee: platformFeeAmount,
      } as Record<string, unknown>;

      // A API Node do MercadoPago v2 espera que o issuer_id seja um Number,
      // mas o Bricks envia como String. Isso causa o erro 2131 de inferência.
      if (typeof finalPayload.issuer_id === "string") {
        finalPayload.issuer_id = Number(finalPayload.issuer_id);
      }

      // Log seguro (sem dados sensíveis do cartão)
      const safePayloadLog = { ...finalPayload, token: finalPayload["token"] ? "[REDACTED]" : undefined };
      console.log(`${LOG} Final payload to MP API:`, JSON.stringify(safePayloadLog));

      const gateway = new MercadoPagoGateway(company.mpMarketplaceToken);
      const paymentResponse = await gateway.createPayment(finalPayload);

      console.log(`${LOG} MP API response: id=${paymentResponse?.id} status=${paymentResponse?.status} status_detail=${paymentResponse?.status_detail}`);

      if (!paymentResponse || !paymentResponse.id) {
        throw new Error("Erro desconhecido ao processar pagamento.");
      }

      if (paymentResponse.status === "approved" && paymentIntent.status !== "PAID") {
        console.log(`${LOG} Payment approved — delegating to PaymentCompletionService`);
        
        await db.paymentIntent.update({
          where: { id: paymentIntent.id },
          data: { status: "PAID" },
        });

        const orderIdsToProcess: string[] = paymentIntent.orderIds && paymentIntent.orderIds.length > 0 
          ? paymentIntent.orderIds 
          : [paymentIntent.id];

        const orders = await db.order.findMany({
          where: { id: { in: orderIdsToProcess }, companyId },
          include: { orderItems: { select: { unitPrice: true, quantity: true } } },
        });

        if (orders.length > 0 && orders[0].status !== "PAID") {
          await PaymentCompletionService.completeOnlinePayment({
            orderIds: orderIdsToProcess,
            companyId,
            paymentMethod: "CREDIT_CARD",
            customerId: orders[0].customerId,
            orders: orders.map(o => ({
              id: o.id,
              customerId: o.customerId,
              hasServiceTax: o.hasServiceTax,
              orderItems: o.orderItems,
            })),
            platformFeeRate,
            platformFeeAmount,
            netAmount,
            externalPaymentId: paymentResponse.id?.toString(),
            paymentProvider: "MERCADOPAGO",
          });
          console.log(`${LOG} ✅ Orders converted to Sale via PaymentCompletionService.`);
        }
      } else if (paymentResponse.status === "pending" || paymentResponse.status === "in_process") {
        console.log(`${LOG} Payment pending/in_process — waiting for webhook to confirm.`);
      }

      let mappedMessage = paymentResponse.status_detail;
      if (paymentResponse.status === "rejected") {
        mappedMessage = translateMercadoPagoError(paymentResponse.status_detail);
      }

      console.log(`${LOG} ─────────────────────────────────────────`);

      return {
        success: paymentResponse.status === "approved",
        status: paymentResponse.status,
        paymentId: paymentResponse.id.toString(),
        statusDetail: paymentResponse.status_detail,
        message: mappedMessage,
      };
    } catch (error: unknown) {
      console.error(`${LOG} ❌ Error:`, error);
      const message = error instanceof Error ? error.message : "Erro ao processar pagamento.";
      return {
        success: false,
        message,
      };
    }
  });
