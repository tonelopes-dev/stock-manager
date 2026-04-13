"use client";

import { Button } from "@/app/_components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { cn } from "@/app/_lib/utils";
import { CheckIcon, PlusIcon } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface ActionFooterProps {
  onSaveOrder: () => void;
  onFinalizeSale: () => void;
  isPending: boolean;
  isUpsertPending: boolean;
  isOrderPending: boolean;
  saleId?: string;
  isReadOnly?: boolean;
}

export const ActionFooter = ({
  onSaveOrder,
  onFinalizeSale,
  isPending,
  isUpsertPending,
  isOrderPending,
  saleId,
  isReadOnly = false,
}: ActionFooterProps) => {
  const { watch } = useFormContext();
  const items = watch("items") || [];
  const paymentMethod = watch("paymentMethod");

  const hasItems = items.length > 0;

  if (isReadOnly) {
    return (
      <div className="mt-2 rounded-2xl bg-muted/50 p-3 text-center">
        <p className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
          Visualização em modo de consulta
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mt-2 grid gap-2",
        paymentMethod ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {paymentMethod && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="h-12 w-full gap-2 bg-emerald-600 text-[11px] font-black uppercase tracking-tight text-background shadow-lg shadow-emerald-100 transition-all hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50"
              data-testid="finalize-sale-button"
              disabled={!hasItems || isPending}
              onClick={onFinalizeSale}
            >
              {isUpsertPending ? (
                <span className="animate-pulse">...</span>
              ) : (
                <>
                  <CheckIcon size={16} />
                  Finalizar
                </>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="text-center text-[10px] font-bold uppercase"
          >
            Finaliza a venda com pagamento imediato
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={paymentMethod ? "outline" : "default"}
            className={cn(
              "h-12 w-full gap-2 text-[11px] font-black uppercase tracking-tight transition-all active:scale-[0.98] disabled:opacity-50",
              !paymentMethod && "shadow-lg shadow-primary/20",
            )}
            data-testid="open-order-button"
            disabled={!hasItems || isPending}
            onClick={onSaveOrder}
          >
            {isOrderPending ? (
              <span className="animate-pulse">...</span>
            ) : (
              <>
                <PlusIcon size={16} />
                {saleId ? "Salvar" : "Comanda"}
              </>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="text-center text-[10px] font-bold uppercase"
        >
          Salva o pedido sem processar o pagamento agora
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
