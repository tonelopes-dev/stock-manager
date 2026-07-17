import { supabase } from "@/app/_lib/supabase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

interface UsePaymentRealtimeProps {
  companyId: string;
  orderIds: string[];
  enabled: boolean;
  onPaymentSuccess?: () => void;
}

export const usePaymentRealtime = ({
  companyId,
  orderIds,
  enabled,
  onPaymentSuccess,
}: UsePaymentRealtimeProps) => {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || !companyId || orderIds.length === 0) return;

    const channel = supabase
      .channel(`kds-${companyId}`, { config: { broadcast: { ack: false } } })
      .on(
        "broadcast",
        { event: "update_order" },
        ({ payload }: { payload: Record<string, unknown> }) => {
          const id = payload.id as string;
          const status = payload.status as string;

          if (orderIds.includes(id) && status === "PAID") {
            console.log("✅ PIX Recebido (update_order):", id);
            toast.success("Pagamento recebido via PIX Integrado!");
            router.refresh();
            
            if (onPaymentSuccess) {
              onPaymentSuccess();
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId, orderIds.join(","), enabled, onPaymentSuccess, router]);
};
