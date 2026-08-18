"use client";

import { Button } from "@/app/_components/ui/button";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import { cn } from "@/app/_lib/utils";
import { formatCurrency } from "@/app/_utils/currency";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LayoutGridIcon,
  ListIcon,
  Trash2,
} from "lucide-react";
import { GroupedItem } from "./use-comanda-state";

interface ComandaItemsListProps {
  groupedItems: GroupedItem[];
  isGrouped: boolean;
  setIsGrouped: (grouped: boolean) => void;
  selectedItemIds: Set<string>;
  toggleItemSelection: (id: string) => void;
  handleDeleteItem: (id: string) => void;
}

export const ComandaItemsList = ({
  groupedItems,
  isGrouped,
  setIsGrouped,
  selectedItemIds,
  toggleItemSelection,
  handleDeleteItem,
}: ComandaItemsListProps) => {
  return (
    <div className="flex lg:min-h-0 flex-col bg-background p-2 flex-none lg:flex-1">
      <div className="mb-4 flex items-center justify-between px-1 sticky top-0 z-10 bg-background py-2">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Itens Consumidos
        </h4>
        <div className="flex gap-1 rounded-xl bg-muted/40 p-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGrouped(true)}
            className={cn(
              "h-7 gap-1.5 rounded-lg px-3 text-[9px] font-black uppercase tracking-tight transition-all",
              isGrouped
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:bg-white/50",
            )}
          >
            <LayoutGridIcon size={12} />
            Agrupar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsGrouped(false)}
            className={cn(
              "h-7 gap-1.5 rounded-lg px-3 text-[9px] font-black uppercase tracking-tight transition-all",
              !isGrouped
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:bg-white/50",
            )}
          >
            <ListIcon size={12} />
            Detalhado
          </Button>
        </div>
      </div>

      <div className="scrollbar-hide hover:scrollbar-default flex-none lg:flex-1 overflow-visible lg:overflow-y-auto pr-1 transition-all">
        {/* Items are rendered after the add-item section in the parent */}
        <div className="space-y-2">
          {groupedItems.map((item) => (
            <div
              key={isGrouped ? `group-${item.productId}` : item.id}
              className={cn(
                "flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all",
                !isGrouped && selectedItemIds.has(item.id)
                  ? "border-primary/30 bg-primary/[0.02]"
                  : "border-border bg-background hover:border-border",
                isGrouped && "opacity-95",
              )}
            >
              <div className="flex items-center gap-3">
                {isGrouped ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-not-allowed opacity-20">
                        <Checkbox
                          checked={false}
                          disabled
                          className="h-5 w-5 rounded-md border-border"
                        />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px] font-bold uppercase">
                      Desagrupe para selecionar itens individuais
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Checkbox
                    checked={selectedItemIds.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                    className="h-5 w-5 rounded-md border-border"
                  />
                )}
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-[10px] font-black text-muted-foreground">
                  {item.quantity}x
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground">
                    {item.productName || item.name}
                  </span>
                  {!isGrouped && (
                    <>
                      <span className="text-[10px] italic text-muted-foreground">
                        Pedido há{" "}
                        {formatDistanceToNow(new Date(item.createdAt), {
                          locale: ptBR,
                        })}
                      </span>
                      {item.notes && (
                        <div className="mt-1 rounded-lg bg-destructive/10 px-2 py-1 border border-destructive/20">
                          <p className="text-[10px] font-bold uppercase italic text-destructive">
                            OBS: {item.notes}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-sm font-black text-primary">
                  {formatCurrency(Number(item.price) * item.quantity)}
                </p>
                {isGrouped ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-not-allowed opacity-20">
                        <Trash2 className="h-5 w-5 text-rose-500" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="text-[10px] font-bold uppercase">
                      Desagrupe para cancelar itens individuais
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteItem(item.id)}
                    className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
