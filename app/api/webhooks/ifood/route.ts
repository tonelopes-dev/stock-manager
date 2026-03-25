import { NextResponse } from "next/server";
import { IfoodAuthService } from "@/app/_services/ifood/auth-service";
import { IfoodOrderService, IfoodEvent } from "@/app/_services/ifood/order-service";
import { db } from "@/app/_lib/prisma";

/**
 * iFood Webhook Route
 * Receives events from the iFood Merchant API (Polling/Webhooks).
 */
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);
    
    // Normalize to array
    const events: IfoodEvent[] = Array.isArray(payload) ? payload : [payload];

    // Silence KEEPALIVE and skip processing
    const nonKeepAlive = events.filter(e => e.code !== "KEEPALIVE");
    if (nonKeepAlive.length === 0) {
      // It's just keep-alive, ACK and return fast
      return NextResponse.json({ message: "Keep-alive processed" }, { status: 200 });
    }

    console.log(`[iFood Webhook] Processando ${nonKeepAlive.length} evento(s) real(is).`);

    // 1. Process real events
    for (const event of nonKeepAlive) {
      try {
        await IfoodOrderService.processIfoodOrder(event);
      } catch (error) {
        console.error(`[iFood Webhook] Erro ao processar o evento ${event.id}:`, error);
      }
    }

    // 2. Acknowledge events (ACK) to remove them from the iFood queue.
    try {
      const merchantId = events[0].merchantId;
      const company = await db.company.findFirst({
        where: { ifoodMerchantId: merchantId },
        select: { id: true },
      });

      if (company) {
        const accessToken = await IfoodAuthService.getAccessToken(company.id);
        const ackBody = events.map((e) => ({ id: e.id }));

        const response = await fetch("https://merchant-api.ifood.com.br/order/v1.0/events/acknowledgment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${accessToken}`,
          },
          body: JSON.stringify(ackBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[iFood Webhook] Falha ao enviar ACK para o iFood: ${errorText}`);
        } else {
          console.log(`[iFood Webhook] ACK enviado com sucesso para ${events.length} evento(s).`);
        }
      } else {
        console.warn(`[iFood Webhook] Empresa não encontrada para o merchantId: ${merchantId}`);
      }
    } catch (ackError) {
      console.error("[iFood Webhook] Erro crítico ao tentar realizar o ACK:", ackError);
    }

    return NextResponse.json({ message: "Events received and processed" }, { status: 200 });

  } catch (error) {
    console.error("[iFood Webhook] Erro fatal na rota de webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 200 });
  }
}
