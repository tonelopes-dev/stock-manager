/**
 * use-kds-sync.ts
 *
 * Manages the real-time synchronization of KDS orders using Supabase Broadcast.
 *
 * Architecture Decision:
 * We use Broadcast (not postgres_changes) because the Supabase `anon` role no longer has
 * SELECT access to the Order/OrderItem tables (revoked for security). `postgres_changes`
 * silently fails when RLS blocks the payload delivery to the anon client.
 *
 * Broadcast is a pure message-passing channel — it requires no table permissions and receives
 * a fully mapped KDSOrderDto payload emitted server-side by the Server Action after the
 * Prisma commit. No secondary SELECT is needed on the browser.
 */
import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";
import { supabase } from "@/app/_lib/supabase";
import { OrderStatus } from "@prisma/client";
import { useEffect, useRef, useState } from "react";

interface UseKdsSyncProps {
  initialOrders: KDSOrderDto[];
  companyId: string;
}

/**
 * Normalizes an order payload received over the Broadcast channel.
 * The Server Action serializes `createdAt` as an ISO string for JSON transport.
 * We convert it back to a proper Date object here to match the KDSOrderDto shape.
 */
const normalizeOrderPayload = (raw: Record<string, unknown>): KDSOrderDto => ({
  id: raw.id as string,
  orderNumber: raw.orderNumber as number,
  status: raw.status as OrderStatus,
  tableNumber: (raw.tableNumber as string | null) ?? null,
  notes: (raw.notes as string | null) ?? null,
  customerName: (raw.customerName as string | null) ?? null,
  customerPhone: (raw.customerPhone as string | null) ?? null,
  customerImageUrl: (raw.customerImageUrl as string | null) ?? null,
  // ISO string from server → Date object for consistency with the DTO type
  createdAt: new Date(raw.createdAt as string),
  items: (raw.items as KDSOrderDto["items"]) ?? [],
});

export const useKdsSync = ({ initialOrders, companyId }: UseKdsSyncProps) => {
  const [orders, setOrders] = useState<KDSOrderDto[]>(initialOrders);
  const pendingUpdates = useRef<Set<string>>(new Set());

  /**
   * Plays a brief audio beep to notify kitchen staff of a new incoming order.
   * Uses the Web Audio API to avoid external sound file dependencies.
   */
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext!)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.warn("Audio Context failed", e);
    }
  };

  useEffect(() => {
    const channel = supabase
      // `broadcast: { ack: false }` marks this as an open public channel.
      // This is required for the anon client to receive Broadcast events without
      // RLS blocking the subscription (since the anon role has no table permissions).
      .channel(`kds-${companyId}`, { config: { broadcast: { ack: false } } })
      // new_order: A new order was created — add it to the top of the list
      .on(
        "broadcast",
        { event: "new_order" },
        ({ payload }: { payload: Record<string, unknown> }) => {
          console.log("📡 KDS Broadcast (new_order):", payload.id);
          playBeep();
          const newOrder = normalizeOrderPayload(payload);
          setOrders((prev) => {
            // Guard: do not add duplicates if the optimistic update already inserted this order
            if (prev.some((o) => o.id === newOrder.id)) return prev;
            return [newOrder, ...prev];
          });
        }
      )
      // update_order: An order's status was updated externally (e.g. by another device)
      .on(
        "broadcast",
        { event: "update_order" },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const orderId = payload.id as string;
          console.log("📡 KDS Broadcast (update_order):", orderId);

          // Skip if this update was initiated by this client (optimistic update in flight)
          if (pendingUpdates.current.has(orderId)) return;

          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? { ...o, status: payload.status as OrderStatus }
                : o
            )
          );
        }
      )
      .subscribe((status, err) => {
        if (status === "SUBSCRIBED") {
          console.log(`✅ KDS Broadcast (${companyId}): Subscribed`);
        }
        if (status === "CHANNEL_ERROR") {
          console.error("❌ KDS Broadcast Error:", err?.message ?? err ?? "Unknown Error");
        }
        if (status === "TIMED_OUT") {
          console.warn("⚠️ KDS Broadcast Timeout — retrying...");
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  // Sync with server-side re-renders (e.g. tab navigation triggers a page re-fetch)
  useEffect(() => {
    if (pendingUpdates.current.size === 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  return { orders, setOrders, pendingUpdates };
};
