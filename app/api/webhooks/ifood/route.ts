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
    const events: IfoodEvent[] = await req.json();

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ message: "No events to process" }, { status: 200 });
    }

    console.log(`[iFood Webhook] Recebidos ${events.length} eventos.`);

    // 1. Process events (New orders, cancellations, etc.)
    // For now, we process sequentially, but we could parallelize if needed.
    for (const event of events) {
      try {
        await IfoodOrderService.processIfoodOrder(event);
      } catch (error) {
        // We log it but continue processing other events in the batch
        console.error(`[iFood Webhook] Erro ao processar o evento ${event.id}:`, error);
      }
    }

    // 2. Acknowledge events (ACK) to remove them from the iFood queue.
    // We send back the IDs of the events we just processed.
    try {
      // Find the companyId associated with these events (assuming all are for the same merchantId in this batch)
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
          console.log(`[iFood Webhook] ACK enviado com sucesso para ${events.length} eventos.`);
        }
      } else {
        console.warn(`[iFood Webhook] Empresa não encontrada para o merchantId: ${merchantId}`);
      }
    } catch (ackError) {
      console.error("[iFood Webhook] Erro crítico ao tentar realizar o ACK:", ackError);
    }

    // 3. Fast ACK: Always return 200 OK to the iFood request immediately after processing.
    return NextResponse.json({ message: "Events received and processed" }, { status: 200 });

  } catch (error) {
    console.error("[iFood Webhook] Erro fatal na rota de webhook:", error);
    // Even on error, we return 200 to iFood so it doesn't keep retrying the SAME batch indefinitely (optional strategy)
    // but the instruction was "Fast ACK", so let's stick to returning success.
    return NextResponse.json({ error: "Internal Server Error" }, { status: 200 });
  }
}
