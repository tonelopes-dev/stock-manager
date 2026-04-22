import { auth } from "@/app/_lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);
  
  // Hybrid detection: 
  // 1. If session exists (ERP), use session.companyId
  // 2. Otherwise use query param (Public Menu / Anonymous)
  const companyId = (session?.user as any)?.companyId || searchParams.get("companyId");

  if (!companyId) {
    return new Response("Missing companyId", { status: 400 });
  }
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    console.error("[KDS_STREAM] Missing Upstash configuration");
    return new Response("Internal Server Error", { status: 500 });
  }

  const url = `${baseUrl}/subscribe/kds:${companyId}?_token=${token}`;
  
  // Use AbortController to prevent 5-minute hangs on initial connection
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for headers

  try {
    const upstreamResponse = await fetch(url, {
      cache: "no-store",
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!upstreamResponse.ok) {
      throw new Error(`Upstash returned ${upstreamResponse.status}`);
    }

    // Pipe the Upstash SSE stream directly to the client
    return new Response(upstreamResponse.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // Disable buffering for Nginx/Vercel
      },
    });
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === "AbortError") {
      console.warn(`[KDS_STREAM] Connection timeout for company: ${companyId}`);
      return new Response("Connection timeout", { status: 504 });
    }

    console.error("[KDS_STREAM_ERROR]", error.message || error);
    return new Response("Error connecting to event stream", { status: 500 });
  }
}
