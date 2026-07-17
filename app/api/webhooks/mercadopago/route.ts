import { IMercadoPagoWebhookBody } from "@/app/_services/payments/types";
import { createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import "server-only";
import { handleSystemSubscriptionWebhook } from "./_handlers/system-subscription.handler";
import { handleTenantPaymentWebhook } from "./_handlers/tenant-payment.handler";

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
    
    // 1. Extração de Headers
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");
    
    const body = (await req.json()) as IMercadoPagoWebhookBody;

    // 2. Validação Criptográfica (Early Reject)
    if (xSignature && xRequestId && process.env.MP_WEBHOOK_SECRET) {
      // Formato do header: ts=1234567,v1=abcdef...
      const tsMatch = xSignature.match(/ts=(\d+)/);
      const v1Match = xSignature.match(/v1=([a-f0-9]+)/);
      
      if (tsMatch && v1Match) {
        const ts = tsMatch[1];
        const receivedHash = v1Match[1];
        
        // O Mercado Pago envia o ID primário no data.id (ou query params)
        const dataId = url.searchParams.get("data.id") ?? body.data?.id ?? body.id;
        
        if (dataId) {
          const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
          const secret = process.env.MP_WEBHOOK_SECRET;
          
          const generatedHash = createHmac("sha256", secret)
            .update(manifest)
            .digest("hex");
            
          if (generatedHash !== receivedHash) {
            console.error("[MercadoPago Webhook] ❌ Assinatura inválida. Forged request detectada!");
            return new NextResponse("Forbidden - Invalid Signature", { status: 403 });
          }
        }
      }
    } else {
      console.warn("[MercadoPago Webhook] ⚠️ Webhook recebido sem x-signature, x-request-id ou MP_WEBHOOK_SECRET não configurado.");
      // Em produção estrita, você pode forçar o reject se não tiver a assinatura:
      // return new NextResponse("Forbidden - Missing Signature", { status: 403 });
    }

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
