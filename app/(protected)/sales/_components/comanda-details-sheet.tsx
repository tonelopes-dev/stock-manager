"use client";

import { ComandaDto } from "@/app/_data-access/order/get-active-comandas";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { formatCurrency } from "@/app/_helpers/currency";
import {
  Clock,
  Smartphone,
  CreditCard,
  DollarSign,
  Wallet,
  CheckCircle2,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { useState, useTransition, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { convertOrderToSaleAction } from "@/app/_actions/order/convert-to-sale";
import { upsertOrderAction } from "@/app/_actions/order/upsert-order";
import { convertItemsToSaleAction } from "@/app/_actions/order/convert-items-to-sale";
import { deleteOrderItemAction } from "@/app/_actions/order/delete-order-item";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";
import { Combobox } from "@/app/_components/ui/combobox";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Sheet as UISheet,
  SheetContent as UISheetContent,
  SheetHeader as UISheetHeader,
  SheetTitle as UISheetTitle,
  SheetDescription as UISheetDescription,
  SheetFooter as UISheetFooter,
} from "@/app/_components/ui/sheet";
import { cn } from "@/app/_lib/utils";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";

interface ComandaDetailsSheetProps {
  comanda: ComandaDto | null;
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
}

const paymentMethodLabels: Record<
  string,
  { label: string; icon: React.ReactNode }
> = {
  PIX: { label: "PIX", icon: <Smartphone className="h-3.5 w-3.5" /> },
  CASH: { label: "Dinheiro", icon: <DollarSign className="h-3.5 w-3.5" /> },
  CREDIT_CARD: {
    label: "Crédito",
    icon: <CreditCard className="h-3.5 w-3.5" />,
  },
  DEBIT_CARD: { label: "Débito", icon: <CreditCard className="h-3.5 w-3.5" /> },
  OTHER: { label: "Outro", icon: <Wallet className="h-3.5 w-3.5" /> },
};

export const ComandaDetailsSheet = ({
  comanda,
  isOpen,
  onClose,
  companyId,
  products,
  productOptions,
}: ComandaDetailsSheetProps) => {
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [now, setNow] = useState(new Date());

  // Add Item State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Partial Payment State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );

  const router = useRouter();

  // Reset state when sheet opens/closes or comanda changes
  useEffect(() => {
    if (isOpen) {
      setSelectedItemIds(new Set());
      setSelectedProductId("");
      setSelectedQuantity(1);
    }
  }, [isOpen, comanda?.customerId]);

  const partialTotal = useMemo(() => {
    if (!comanda) return 0;
    return comanda.items
      .filter((item) => selectedItemIds.has(item.id))
      .reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [comanda, selectedItemIds]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!comanda) return null;

  const handlePay = () => {
    if (!paymentMethod) {
      toast.error("Selecione um método de pagamento.");
      return;
    }

    startTransition(async () => {
      try {
        if (selectedItemIds.size === 0) {
          // PAY EVERYTHING (Standard logic)
          for (const order of comanda.orders) {
            const result = await convertOrderToSaleAction({
              orderId: order.id,
              companyId,
              paymentMethod: paymentMethod as any,
            });
            if (result?.serverError) throw new Error(result.serverError);
          }
        } else {
          // PARTIAL PAYMENT
          const result = await convertItemsToSaleAction({
            itemIds: Array.from(selectedItemIds),
            companyId,
            paymentMethod: paymentMethod as any,
          });

          if (result?.serverError) throw new Error(result.serverError);
        }

        toast.success(
          `Comanda de ${comanda.customerName} finalizada com sucesso!`,
        );
        router.refresh();
        onClose();
      } catch (err: any) {
        toast.error(`Erro ao processar pagamento: ${err.message}`);
      }
    });
  };

  const handleAddItem = () => {
    if (!selectedProductId) return;

    startTransition(async () => {
      try {
        const result = await upsertOrderAction({
          companyId,
          customerId: comanda.customerId,
          items: [{ productId: selectedProductId, quantity: selectedQuantity }],
        });

        if (result?.serverError) throw new Error(result.serverError);

        toast.success("Item adicionado com sucesso!");
        setSelectedProductId("");
        setSelectedQuantity(1);
        router.refresh();
      } catch (err: any) {
        toast.error(`Erro ao adicionar item: ${err.message}`);
      }
    });
  };

  const toggleItemSelection = (id: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedItemIds(newSelection);
  };

  const handleDeleteItem = (itemId: string) => {
    startTransition(async () => {
      try {
        const result = await deleteOrderItemAction({
          itemId,
          companyId,
        });

        if (result?.serverError) throw new Error(result.serverError);

        toast.success("Item cancelado com sucesso!");
        router.refresh();
      } catch (err: any) {
        toast.error(`Erro ao cancelar item: ${err.message}`);
      }
    });
  };

  const isPartial = selectedItemIds.size > 0;

  return (
    <UISheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <UISheetContent className="flex h-full w-full flex-col border-l border-slate-100 bg-white p-0 shadow-2xl sm:max-w-md">
        <UISheetHeader className="border-b border-slate-50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                <ShoppingCart size={24} />
              </div>
              <div className="flex flex-col text-left">
                <UISheetTitle className="text-xl font-black uppercase italic leading-tight tracking-tighter text-slate-900">
                  {comanda.customerName}
                </UISheetTitle>
                <UISheetDescription className="text-xs font-bold text-slate-400">
                  {comanda.customerPhone || "Sem telefone"}
                </UISheetDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 border-none bg-emerald-50 text-[10px] font-black uppercase text-emerald-600"
            >
              Ativa
            </Badge>
          </div>
        </UISheetHeader>

        <div className="scrollbar-hide flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-8">
            {/* Summary Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-50 bg-slate-50/50 p-4">
                <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase italic tracking-tighter text-slate-400">
                  <Clock size={12} />
                  Aberta há
                </span>
                <p className="text-sm font-bold capitalize text-slate-700">
                  {formatDistanceToNow(comanda.firstOrderAt, { locale: ptBR })}
                </p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-right">
                <span className="mb-1 flex items-center justify-end gap-1.5 text-[10px] font-black uppercase italic tracking-tighter text-primary/60">
                  <CheckCircle2 size={12} />
                  Total Acumulado
                </span>
                <p className="text-xl font-black tracking-tighter text-primary">
                  {formatCurrency(comanda.totalAmount)}
                </p>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Itens Consumidos
              </h4>
              <div className="space-y-2">
                {comanda.items.map((item, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "flex items-center justify-between rounded-xl border p-3 shadow-sm transition-all",
                      selectedItemIds.has(item.id)
                        ? "border-primary/30 bg-primary/[0.02]"
                        : "border-slate-50 bg-white hover:border-slate-100",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedItemIds.has(item.id)}
                        onCheckedChange={() => toggleItemSelection(item.id)}
                        className="h-5 w-5 rounded-md border-slate-200"
                      />
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">
                        {item.quantity}x
                      </div>
                      <span className="text-sm font-bold text-slate-700">
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteItem(item.id)}
                        disabled={isPending}
                        className="h-8 w-8 rounded-lg text-slate-300 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Items Section */}
            <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/30 p-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                + Adicionar Itens
              </h4>
              <div className="flex flex-col gap-3">
                <Combobox
                  options={productOptions}
                  value={selectedProductId}
                  onChange={setSelectedProductId}
                  placeholder="Buscar produto..."
                />
                <div className="flex items-center gap-3">
                  <QuantityStepper
                    value={selectedQuantity}
                    onChange={setSelectedQuantity}
                    min={1}
                    className="h-10 w-32"
                  />
                  <Button
                    onClick={handleAddItem}
                    disabled={!selectedProductId || isPending}
                    className="h-10 flex-1 rounded-xl bg-slate-900 text-xs font-bold uppercase italic transition-all active:scale-95"
                  >
                    {isPending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                      "Adicionar"
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Partial selection info */}
            {isPartial && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-center">
                <p className="text-[10px] font-bold text-emerald-600">
                  {selectedItemIds.size} item(s) selecionado(s) para pagamento
                  parcial.
                </p>
              </div>
            )}
          </div>
        </div>

        <UISheetFooter className="mt-auto flex-col border-t border-slate-50 bg-slate-50/30 p-6">
          <div className="w-full space-y-4">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Forma de Pagamento
              </span>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white font-bold shadow-sm focus:ring-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={5}
                  className="w-[var(--radix-select-trigger-width)]"
                >
                  {Object.entries(paymentMethodLabels).map(
                    ([key, { label, icon }]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="my-1 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="font-bold">{label}</span>
                        </div>
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>

            <Button
              className={cn(
                "h-14 w-full rounded-2xl text-lg font-black uppercase italic tracking-wider ring-offset-2 transition-all active:scale-95 disabled:opacity-50",
                isPartial
                  ? "bg-primary text-white shadow-lg shadow-primary/20 hover:bg-primary/90"
                  : "bg-emerald-600 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700",
              )}
              disabled={isPending}
              onClick={handlePay}
            >
              {isPending ? (
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white" />
              ) : (
                <>
                  {isPartial ? "Pagar Selecionados" : "Finalizar Comanda"} •{" "}
                  {formatCurrency(
                    isPartial ? partialTotal : comanda.totalAmount,
                  )}
                </>
              )}
            </Button>
          </div>
        </UISheetFooter>
      </UISheetContent>
    </UISheet>
  );
};

export default ComandaDetailsSheet;
