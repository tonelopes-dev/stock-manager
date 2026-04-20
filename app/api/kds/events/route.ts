import { NextRequest } from "next/server";

// In-memory registry of clients. 
// Note: This won't work in serverless environments (Vercel) without a pub/sub layer like Redis.
// But for VPS/Long-running processes, it works fine.
type KDSClient = {
  companyId: string;
  controller: ReadableStreamDefaultController;
};

const clients = new Set<KDSClient>();

export async function GET(req: NextRequest) {
  const companyId = req.nextUrl.searchParams.get("companyId");

  if (!companyId) {
    return new Response("Missing companyId", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const client: KDSClient = { companyId, controller };
      clients.add(client);

      // Keep connection alive
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch (e) {
          clearInterval(keepAlive);
          clients.delete(client);
        }
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        clients.delete(client);
      });
    },
    cancel() {
      // Handled by abort listener
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}

import { redis } from "@/app/_lib/redis";

// Function to notify clients via Redis Pub/Sub
export async function notifyKDS(companyId: string, data: any) {
  try {
    const channel = `kds:${companyId}`;
    await redis.publish(channel, JSON.stringify(data));
    
    // Also notify local clients for zero-downtime migration
    const message = `data: ${JSON.stringify(data)}\n\n`;
    const encoder = new TextEncoder();
    const encoded = encoder.encode(message);

    for (const client of clients) {
      if (client.companyId === companyId) {
        try {
          client.controller.enqueue(encoded);
        } catch (e) {
          clients.delete(client);
        }
      }
    }
  } catch (error) {
    console.error("[REDIS_KDS_ERROR] Failed to publish event:", error);
    // We don't rethrow to avoid breaking the core business logic (fire-and-forget)
  }
}
