import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { handleTenantPaymentWebhook } from "./_handlers/tenant-payment.handler";
import { handleSystemSubscriptionWebhook } from "./_handlers/system-subscription.handler";
import { IMercadoPagoWebhookBody } from "@/app/_services/payments/types";

export const dynamic = "force-dynamic";

/**
 * Mercado Pago Webhooks Router
 *
 * Single Responsibility: parse the incoming request and route it to the correct domain handler.
 */
export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");
    const body = (await req.json()) as IMercadoPagoWebhookBody;

    // Se temos tenantCompanyId na query, este é o webhook de pagamento de um estabelecimento (Tenant)
    if (companyId) {
      return await handleTenantPaymentWebhook(companyId, body);
    }

    // Se NÃO temos tenantCompanyId na query, este é o webhook do sistema (Assinatura Kipo Pro)
    return await handleSystemSubscriptionWebhook(body, url.searchParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[MercadoPago Webhook] Error processing webhook:", message);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
