import { NextRequest } from "next/server";

// In-memory registry of clients. 
// Note: This won't work in serverless environments (Vercel) without a pub/sub layer like Redis.
// But for VPS/Long-running processes, it works fine.
type KDSClient = {
  companyId: string;
  controller: ReadableStreamDefaultController;
};

// Persist clients across hot-reloads in development
const globalForSSE = globalThis as unknown as {
  kdsClients: Set<KDSClient>;
};

const clients = globalForSSE.kdsClients || new Set<KDSClient>();

if (process.env.NODE_ENV !== "production") {
  globalForSSE.kdsClients = clients;
}

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

// Function to notify clients (can be called from actions/services)
// In a scalable app, this would publish to Redis.
export function notifyKDS(companyId: string, data: any) {
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
}
