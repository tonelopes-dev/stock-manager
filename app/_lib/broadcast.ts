/**
 * broadcast.ts
 *
 * Generic server-side utility for emitting Supabase Broadcast events to any channel.
 */
import { supabaseAdmin } from "@/app/_lib/supabase-admin";

/**
 * Emits a Broadcast event on a specific channel.
 * Waits for the WebSocket to be SUBSCRIBED before sending, then cleans up.
 */
export async function broadcastEvent(
  channelName: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  return new Promise((resolve) => {
    const channel = supabaseAdmin.channel(channelName);

    const cleanup = () => {
      supabaseAdmin.removeChannel(channel).catch((err) => {
        console.warn(`[Broadcast] Failed to remove channel ${channelName}:`, err);
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
          console.log(`📡 [Broadcast] Sent '${event}' to ${channelName}`);
        } catch (err) {
          console.error(`[Broadcast] Failed to send '${event}' to ${channelName}:`, err);
        } finally {
          cleanup();
          resolve();
        }
      }

      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[Broadcast] Channel error (${status}) for ${channelName}`);
        cleanup();
        resolve(); // resolve anyway so the Server Action is not blocked
      }
    });
  });
}
