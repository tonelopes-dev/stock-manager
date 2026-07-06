"use server";

import { actionClient } from "@/app/_lib/safe-action";
import { z } from "zod";
import { MercadoPagoGateway } from "@/app/_services/payments/mercadopago-gateway";
import { getIntegrationRawData } from "@/app/_data-access/integration/get-integration-raw";
import { IntegrationProvider } from "@prisma/client";
import { db } from "@/app/_lib/prisma";

const processTransparentPaymentSchema = z.object({
  companyId: z.string(),
  formData: z.any(), // Payload from Mercado Pago Bricks
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
    cc_rejected_other_reason: "O emissor do seu cartão não autorizou o pagamento."
  };

  return errorMap[statusDetail] || "Pagamento não aprovado. Verifique os dados ou tente outro cartão.";
}

export const processTransparentPayment = actionClient
  .schema(processTransparentPaymentSchema)
  .action(async ({ parsedInput: { companyId, formData } }) => {
    try {
      // 1. Pega o Access Token do lojista
      const integration = await getIntegrationRawData(companyId, IntegrationProvider.MERCADOPAGO);
      if (!integration?.isEnabled || !integration.credentials?.accessToken) {
        throw new Error("Integração do Mercado Pago não configurada para este estabelecimento.");
      }

      const gateway = new MercadoPagoGateway(integration.credentials.accessToken);

      // 2. Processa o pagamento via API do Mercado Pago
      // A formData do Brick já vem no formato aceito pelo endpoint /v1/payments
      const paymentResponse = await gateway.createPayment(formData);

      if (!paymentResponse || !paymentResponse.id) {
        throw new Error("Erro desconhecido ao processar pagamento.");
      }

      // 3. Atualiza o banco de dados conforme o status (opcionalmente sincronizando antes do webhook)
      // Nota: Para Pix (pending/in_process), o webhook fará a finalização
      // Para Cartão de Crédito aprovado na hora, podemos já adiantar o status
      if (paymentResponse.status === "approved" && paymentResponse.external_reference) {
        // Adianta o status para PAID no PaymentIntent
        const paymentIntent = await db.paymentIntent.findFirst({
          where: { externalId: paymentResponse.external_reference, companyId },
        });

        if (paymentIntent && paymentIntent.status !== "PAID") {
          await db.paymentIntent.update({
            where: { id: paymentIntent.id },
            data: { status: "PAID" },
          });

          // Observação: OrderService.convertToSale não é chamado aqui de imediato 
          // para evitar race condition pesada com o Webhook. O webhook chegará em ms
          // e terminará o processo de conversão em Sale com Idempotência segura.
        }
      }

      let mappedMessage = paymentResponse.status_detail;
      if (paymentResponse.status === "rejected") {
        mappedMessage = translateMercadoPagoError(paymentResponse.status_detail);
      }

      return {
        success: paymentResponse.status === "approved",
        status: paymentResponse.status,
        paymentId: paymentResponse.id.toString(),
        statusDetail: paymentResponse.status_detail,
        message: mappedMessage,
      };
    } catch (error: any) {
      console.error("[processTransparentPayment] Error:", error);
      return {
        success: false,
        message: error.message || "Erro ao processar pagamento.",
      };
    }
  });
