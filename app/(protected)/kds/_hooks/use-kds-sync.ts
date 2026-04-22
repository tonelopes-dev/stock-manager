import { useState, useEffect, useRef } from "react";
import { supabase } from "@/app/_lib/supabase";
import { KDSOrderDto } from "@/app/_data-access/order/get-kds-orders";

interface UseKdsSyncProps {
  initialOrders: KDSOrderDto[];
  companyId: string;
}

export const useKdsSync = ({ initialOrders, companyId }: UseKdsSyncProps) => {
  const [orders, setOrders] = useState<KDSOrderDto[]>(initialOrders);
  const pendingUpdates = useRef<Set<string>>(new Set());
  const supabase = createClient();

  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch (e) {
      console.warn("Audio Context failed", e);
    }
  };

  useEffect(() => {
    const channel = supabase
      .channel("kds-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "Order", filter: `companyId=eq.${companyId}` },
        async (payload: any) => {
          if (payload.eventType === "INSERT") {
            playBeep();
            const { data: newOrder } = await supabase
              .from("Order")
              .select("*, items:OrderItem(*, product:Product(*, category:Category(*)))")
              .eq("id", payload.new.id)
              .single();

            if (newOrder) {
              setOrders((prev) => [newOrder as KDSOrderDto, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updatedOrder = payload.new as any;
            if (pendingUpdates.current.has(updatedOrder.id)) return;

            setOrders((prev) =>
              prev.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
            );
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "OrderItem" },
        (payload: any) => {
          setOrders((prev) => {
            const orderOfItem = prev.find((o) => o.items.some((i) => i.id === payload.new.id));
            if (orderOfItem && pendingUpdates.current.has(orderOfItem.id)) return prev;

            return prev.map((order) => ({
              ...order,
              items: order.items.map((item) =>
                item.id === payload.new.id ? { ...item, ...payload.new } : item
              ),
            }));
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, supabase]);

  useEffect(() => {
    if (pendingUpdates.current.size === 0) {
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  return { orders, setOrders, pendingUpdates };
};
