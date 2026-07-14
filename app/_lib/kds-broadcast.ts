/**
 * kds-broadcast.ts
 *
 * Server-side utility for emitting Supabase Broadcast events to KDS clients.
 *
 * Why the subscribe → send → removeChannel pattern?
 * ─────────────────────────────────────────────────
 * The Node.js process in a Server Action is stateless — it does not maintain a
 * persistent WebSocket connection. If we call `.send()` directly without first
 * waiting for the WebSocket handshake (`SUBSCRIBED`), the message is dispatched
 * before the socket is open and silently dropped by the Supabase realtime server.
 *
 * The correct flow is:
 *   1. Create the channel
 *   2. Call .subscribe() and wait for `SUBSCRIBED` status
 *   3. Send the message
 *   4. Immediately clean up the channel to avoid memory/connection leaks
 *
 * This is wrapped in a Promise so the Server Action can `await` it cleanly.
 */
import { supabaseAdmin } from "@/app/_lib/supabase-admin";

type BroadcastEvent = "new_order" | "update_order";

/**
 * Emits a Broadcast event on the company-scoped KDS channel.
 * Waits for the WebSocket to be SUBSCRIBED before sending, then cleans up.
 */
export async function broadcastKdsEvent(
  companyId: string,
  event: BroadcastEvent,
  payload: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve) => {
    const channel = supabaseAdmin.channel(`kds-${companyId}`);

    const cleanup = () => {
      supabaseAdmin.removeChannel(channel).catch((err) => {
        console.warn("[KDS Broadcast] Failed to remove channel:", err);
      });
    };

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        try {
          await channel.send({
            type: "broadcast",
            event,
            payload,
          });
          console.log(`📡 [KDS Broadcast] Sent '${event}' to kds-${companyId}`);
        } catch (err) {
          console.error(`[KDS Broadcast] Failed to send '${event}':`, err);
        } finally {
          cleanup();
          resolve();
        }
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[KDS Broadcast] Channel error (${status}) for kds-${companyId}`);
        cleanup();
        resolve(); // resolve anyway so the Server Action is not blocked
      }
    });
  });
}
