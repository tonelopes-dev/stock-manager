import { auth } from "@/app/_lib/auth";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.companyId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const companyId = (session.user as any).companyId;
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!baseUrl || !token) {
    console.error("[KDS_STREAM] Missing Upstash configuration");
    return new Response("Internal Server Error", { status: 500 });
  }

  const url = `${baseUrl}/subscribe/kds:${companyId}?_token=${token}`;

  try {
    const upstreamResponse = await fetch(url, {
      cache: "no-store",
    });

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
  } catch (error) {
    console.error("[KDS_STREAM_ERROR]", error);
    return new Response("Error connecting to event stream", { status: 500 });
  }
}
