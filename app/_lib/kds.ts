import { redis } from "@/app/_lib/redis";

/**
 * Dispara uma notificação para o KDS e outros componentes em tempo real via Redis Pub/Sub.
 * Esta função é resiliente: falhas no Redis não interrompem o fluxo principal do pedido.
 */
export async function notifyKDS(companyId: string, data: any) {
  try {
    const channel = `kds:${companyId}`;
    await redis.publish(channel, JSON.stringify(data));
  } catch (error) {
    console.error("[REDIS_KDS_ERROR] Failed to publish event:", error);
    // Fire-and-forget: não relançamos o erro para não travar a criação/atualização do pedido
  }
}
