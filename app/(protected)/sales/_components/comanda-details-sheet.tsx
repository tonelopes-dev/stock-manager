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
  ListIcon,
  LayoutGridIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/app/_components/ui/tooltip";
import {
  useState,
  useTransition,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { convertOrderToSaleAction } from "@/app/_actions/order/convert-to-sale";
import { upsertOrderAction } from "@/app/_actions/order/upsert-order";
import { convertItemsToSaleAction } from "@/app/_actions/order/convert-items-to-sale";
import { deleteOrderItemAction } from "@/app/_actions/order/delete-order-item";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { QuantityStepper } from "@/app/_components/ui/quantity-stepper";
import { Combobox } from "@/app/_components/ui/combobox";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, format } from "date-fns";
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
import { Label } from "@/app/_components/ui/label";
import { Input } from "@/app/_components/ui/input";
import { Switch } from "@/app/_components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";

import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";

interface ComandaDetailsSheetProps {
  comanda: ComandaDto | null;
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
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
  stages,
  categories,
}: ComandaDetailsSheetProps) => {
  const [isPending, startTransition] = useTransition();
  const [paymentMethod, setPaymentMethod] = useState<string>("PIX");
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(true);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [extraAmount, setExtraAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>("");
  const [adjustmentType, setAdjustmentType] = useState<"discount" | "extra">(
    "discount",
  );
  const [isEmployeeSale, setIsEmployeeSale] = useState<boolean>(false);
  const [now, setNow] = useState(new Date());

  // Add Item State
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);

  // Partial Payment State
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(
    new Set(),
  );
  const [isGrouped, setIsGrouped] = useState<boolean>(false);

  const router = useRouter();

  // Reset state when sheet opens/closes or comanda changes
  useEffect(() => {
    if (isOpen && comanda) {
      setSelectedItemIds(new Set());
      setSelectedProductId("");
      setSelectedQuantity(1);
      setApplyServiceCharge(comanda.hasServiceTax);
      setDiscountAmount(comanda.discountAmount || 0);
      setExtraAmount(comanda.extraAmount || 0);
      setAdjustmentReason(comanda.adjustmentReason || "");
      setAdjustmentType((comanda.extraAmount || 0) > 0 ? "extra" : "discount");
      setIsEmployeeSale(comanda.isEmployeeSale || false);
    }
  }, [isOpen, comanda]);

  const totals = useMemo(() => {
    if (!comanda)
      return {
        subtotal: 0,
        partialTotal: 0,
        itenCount: 0,
        serviceChargeAmount: 0,
        totalWithTip: 0,
        effectiveDiscount: 0,
        relevantSubtotal: 0,
      };

    const calculateSubtotal = (items: typeof comanda.items) => {
      return items.reduce((acc, p) => {
        const unitPrice = isEmployeeSale
          ? Number(p.cost || 0) + Number(p.operationalCost || 0)
          : Number(p.price);
        return acc + unitPrice * p.quantity;
      }, 0);
    };

    const fullSubtotal = calculateSubtotal(comanda.items);
    const selectedItemsList = comanda.items.filter((i) =>
      selectedItemIds.has(i.id),
    );
    const currentPartialSubtotal = calculateSubtotal(selectedItemsList);

    const relevantSubtotal =
      selectedItemIds.size > 0 ? currentPartialSubtotal : fullSubtotal;
    const itenCount =
      selectedItemIds.size > 0
        ? selectedItemsList.reduce((acc, p) => acc + p.quantity, 0)
        : comanda.items.reduce((acc, p) => acc + p.quantity, 0);

    const serviceChargeAmount = applyServiceCharge
      ? Math.round(relevantSubtotal * 0.1 * 100) / 100
      : 0;

    const totalBeforeDiscount = relevantSubtotal + serviceChargeAmount;

    // Boundary check
    const effectiveDiscount = Math.min(discountAmount, totalBeforeDiscount);
    const totalWithTip = Math.max(
      0,
      Math.round(
        (totalBeforeDiscount - effectiveDiscount + extraAmount) * 100,
      ) / 100,
    );

    return {
      fullSubtotal,
      partialTotal: currentPartialSubtotal,
      relevantSubtotal,
      itenCount,
      serviceChargeAmount,
      totalWithTip,
      effectiveDiscount,
      extraAmount,
    };
  }, [
    comanda,
    selectedItemIds,
    applyServiceCharge,
    isEmployeeSale,
    discountAmount,
    extraAmount,
  ]);

  const groupedItems = useMemo(() => {
    if (!comanda) return [];
    if (!isGrouped) return comanda.items;

    const group = comanda.items.reduce((acc: any[], item: any) => {
      const existing = acc.find((i) => i.productId === item.productId);
      if (existing) {
        existing.quantity += item.quantity;
        // Total price for the group is not used for selection, but we can store it
        existing.totalPrice =
          (existing.totalPrice || 0) + Number(item.price) * item.quantity;
      } else {
        acc.push({
          ...item,
          totalPrice: Number(item.price) * item.quantity,
        });
      }
      return acc;
    }, []);

    return group;
  }, [comanda, isGrouped]);

  const currentProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId],
  );

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
          for (let i = 0; i < comanda.orders.length; i++) {
            const order = comanda.orders[i];
            const result = await convertOrderToSaleAction({
              orderId: order.id,
              companyId,
              paymentMethod: paymentMethod as any,
              tipAmount: i === 0 ? totals.serviceChargeAmount : 0,
              discountAmount: i === 0 ? totals.effectiveDiscount : 0,
              extraAmount: i === 0 ? totals.extraAmount : 0,
              adjustmentReason:
                i === 0 && adjustmentReason ? adjustmentReason : undefined,
              isEmployeeSale: isEmployeeSale,
            });
            if (result?.serverError) throw new Error(result.serverError);
          }
        } else {
          // PARTIAL PAYMENT
          const result = await convertItemsToSaleAction({
            itemIds: Array.from(selectedItemIds),
            companyId,
            paymentMethod: paymentMethod as any,
            tipAmount: totals.serviceChargeAmount,
            discountAmount: totals.effectiveDiscount,
            extraAmount: totals.extraAmount,
            adjustmentReason: adjustmentReason || undefined,
            isEmployeeSale,
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
          discountAmount: totals.effectiveDiscount,
          extraAmount: totals.extraAmount,
          adjustmentReason: adjustmentReason || undefined,
          isEmployeeSale,
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
      <UISheetContent className="flex h-full !max-w-full flex-col border-none bg-background p-0 shadow-2xl lg:!max-w-5xl">
        <TooltipProvider delayDuration={0}>
          <UISheetHeader className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
                  <ShoppingCart size={24} />
                </div>
                <div className="flex flex-col text-left">
                  <UISheetTitle className="text-xl font-black uppercase italic leading-tight tracking-tighter text-foreground">
                    {comanda.customerName}
                  </UISheetTitle>
                  <UISheetDescription className="text-xs font-bold text-muted-foreground">
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

          <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-2">
            {/* Left Column: Metrics & Controls */}
            <div className="flex min-h-0 flex-col border-r border-border bg-muted/30">
              <div className="scrollbar-hide hover:scrollbar-default flex-1 space-y-2 overflow-y-auto p-2 transition-all">
                {/* Metrics Section */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
                    <span className="mb-1 flex items-center gap-1.5 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                      <Clock size={12} />
                      Aberta há
                    </span>
                    <p className="text-sm font-bold capitalize text-foreground">
                      {formatDistanceToNow(comanda.firstOrderAt, {
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 text-right shadow-sm">
                    <span className="mb-1 flex items-center justify-end gap-1.5 text-[10px] font-black uppercase italic tracking-tighter text-primary/60">
                      <CheckCircle2 size={12} />
                      Total Acumulado
                    </span>
                    <p className="text-xl font-black tracking-tighter text-primary">
                      {formatCurrency(totals.totalWithTip)}
                    </p>
                  </div>
                </div>

                {/* Employee Mode Toggle */}
                <div className="rounded-xl border border-border bg-background p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Modo Funcionário
                      </Label>
                      <p className="text-[9px] font-medium italic text-muted-foreground">
                        {isEmployeeSale
                          ? "Preço de Custo + Operacional"
                          : "Preço de Venda Normal"}
                      </p>
                    </div>
                    <Switch
                      checked={isEmployeeSale}
                      onCheckedChange={setIsEmployeeSale}
                    />
                  </div>
                </div>

                {/* Adjustment Section */}
                <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/20 p-3">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-xs font-black">⚙️</span>
                        </div>
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          Ajuste Manual
                        </Label>
                      </div>

                      <Tabs
                        value={adjustmentType}
                        onValueChange={(val) => {
                          const type = val as "discount" | "extra";
                          setAdjustmentType(type);
                          if (type === "discount") setExtraAmount(0);
                          else setDiscountAmount(0);
                        }}
                        className="h-8"
                      >
                        <TabsList className="h-8 bg-muted/50 p-1">
                          <TabsTrigger
                            value="discount"
                            className="h-6 text-[10px] font-bold uppercase"
                          >
                            Desconto
                          </TabsTrigger>
                          <TabsTrigger
                            value="extra"
                            className="h-6 text-[10px] font-bold uppercase"
                          >
                            Acréscimo
                          </TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>

                    <div className="flex items-center justify-between border-t border-border/50 pt-4">
                      <div className="space-y-0.5">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                          {adjustmentType === "discount"
                            ? "Valor do Desconto"
                            : "Valor do Acréscimo"}
                        </Label>
                        {adjustmentType === "discount" && (
                          <p className="text-[9px] font-medium italic text-muted-foreground">
                            Máx:{" "}
                            {formatCurrency(
                              totals.relevantSubtotal +
                                totals.serviceChargeAmount,
                            )}
                          </p>
                        )}
                      </div>
                      <div className="relative w-32">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground">
                          R$
                        </span>
                        <Input
                          type="number"
                          min={0}
                          placeholder="0,00"
                          className="h-9 pl-8 font-black text-primary"
                          value={
                            adjustmentType === "discount"
                              ? discountAmount || ""
                              : extraAmount || ""
                          }
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            const amount = isNaN(val) ? 0 : Math.max(0, val);
                            if (adjustmentType === "discount") {
                              setDiscountAmount(amount);
                            } else {
                              setExtraAmount(amount);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {(discountAmount > 0 || extraAmount > 0) && (
                    <div className="space-y-1.5 border-t border-border pt-3">
                      <Label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <CheckCircle2 size={12} className="text-primary" />{" "}
                        Justificativa do Ajuste
                      </Label>
                      <Input
                        placeholder="Ex: Cliente VIP, Troco retido, Cortesia..."
                        className="h-8 text-xs italic"
                        value={adjustmentReason}
                        onChange={(e) => setAdjustmentReason(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* Partial selection info */}
                {isPartial && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 text-center animate-in fade-in slide-in-from-top-2">
                    <p className="text-[10px] font-bold text-emerald-600">
                      {selectedItemIds.size} item(s) selecionado(s) para
                      pagamento parcial.
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Actions Area */}
              <div className="mt-auto border-t border-border bg-background px-3 py-2 shadow-[0_-4px_12px_rgba(0,0,0,0.03)]">
                <div className="w-full space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                        Taxa de Serviço (10%)
                      </Label>
                      <div className="flex h-12 items-center justify-between rounded-xl border border-border bg-muted/50 px-4">
                        <div className="flex items-center gap-3">
                          <Switch
                            checked={applyServiceCharge}
                            onCheckedChange={setApplyServiceCharge}
                            id="comanda-service-charge"
                          />
                          <Label
                            htmlFor="comanda-service-charge"
                            className="text-xs font-bold leading-none"
                          >
                            {applyServiceCharge ? "Ativada" : "Desativada"}
                          </Label>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-black transition-colors",
                            applyServiceCharge
                              ? "text-primary"
                              : "text-muted-foreground/50",
                          )}
                        >
                          {formatCurrency(totals.serviceChargeAmount)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Pagamento
                      </span>
                      <Select
                        value={paymentMethod}
                        onValueChange={setPaymentMethod}
                      >
                        <SelectTrigger className="h-12 rounded-2xl border-border bg-background font-bold shadow-sm focus:ring-primary/20">
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
                  </div>

                  <Button
                    className={cn(
                      "h-14 w-full rounded-2xl text-lg font-black uppercase italic tracking-wider ring-offset-2 transition-all active:scale-95 disabled:opacity-50",
                      isPartial
                        ? "bg-primary text-background shadow-lg shadow-primary/20 hover:bg-primary/90"
                        : "bg-emerald-600 text-background shadow-lg shadow-emerald-100 hover:bg-emerald-700",
                    )}
                    disabled={isPending}
                    onClick={handlePay}
                  >
                    {isPending ? (
                      <div className="h-6 w-6 animate-spin rounded-full border-4 border-white/30 border-t-white" />
                    ) : (
                      <>
                        {isPartial ? "Pagar Selecionados" : "Finalizar Comanda"}{" "}
                        • {formatCurrency(totals.totalWithTip)}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column: consumed items list */}
            <div className="flex min-h-0 flex-col bg-background p-2">
              <div className="mb-4 flex items-center justify-between px-1">
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
              <div className="scrollbar-hide hover:scrollbar-default flex-1 overflow-y-auto pr-1 transition-all">
                {/* Add Items Section (Moved here) */}
                <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4 shadow-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                      <div className="flex flex-col gap-2">
                        <QuantityStepper
                          value={selectedQuantity}
                          onChange={setSelectedQuantity}
                          min={1}
                          className="h-10 w-32"
                        />
                        {currentProduct && (
                          <p className="text-[10px] font-bold text-muted-foreground animate-in fade-in slide-in-from-top-1">
                            Estoque:{" "}
                            <span className="text-foreground">
                              {Number(currentProduct.stock)} unid.
                            </span>
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={handleAddItem}
                        disabled={!selectedProductId || isPending}
                        className="h-10 flex-1 rounded-xl bg-foreground text-xs font-bold uppercase italic transition-all active:scale-95"
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
                <div className="mt-2 space-y-2">
                  {groupedItems.map((item, idx) => (
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
                            <span className="text-[10px] italic text-muted-foreground">
                              Pedido há{" "}
                              {formatDistanceToNow(new Date(item.createdAt), {
                                locale: ptBR,
                              })}
                            </span>
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
          </div>
        </TooltipProvider>
      </UISheetContent>
    </UISheet>
  );
};

export default ComandaDetailsSheet;
