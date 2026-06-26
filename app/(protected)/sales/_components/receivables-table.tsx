"use client";

import { ReceivableDto } from "@/app/_data-access/sale/get-pending-receivables";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { Card } from "@/app/_components/ui/card";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { formatCurrency } from "@/app/_utils/currency";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, MessageCircle, DollarSign, Smartphone, CreditCard, Wallet, ShoppingBag, Calendar } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { settleReceivableAction } from "@/app/_actions/sale/settle-receivable";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/app/_components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/_components/ui/select";
import { Label } from "@/app/_components/ui/label";
import { ExpandableAvatar } from "@/app/_components/expandable-avatar";
import { PaymentMethod } from "@prisma/client";
import { useRouter } from "next/navigation";
import { cn } from "@/app/_lib/utils";
import { Sheet } from "@/app/_components/ui/sheet";
import UpsertSheetContent from "./upsert-sheet-content";

const paymentMethodsConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  PIX: { label: "PIX", icon: <Smartphone className="h-4 w-4 text-emerald-500" /> },
  CASH: { label: "Dinheiro", icon: <DollarSign className="h-4 w-4 text-amber-500" /> },
  CREDIT_CARD: { label: "Cartão de Crédito", icon: <CreditCard className="h-4 w-4 text-blue-500" /> },
  DEBIT_CARD: { label: "Cartão de Débito", icon: <CreditCard className="h-4 w-4 text-indigo-500" /> },
  OTHER: { label: "Outro", icon: <Wallet className="h-4 w-4 text-muted-foreground" /> },
};

interface ReceivablesTableProps {
  initialReceivables: ReceivableDto[];
  search?: string;
  companyId: string;
  products: ProductDto[];
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  stages: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export const ReceivablesTable = ({
  initialReceivables,
  search = "",
  companyId,
  products,
  productOptions,
  customerOptions,
  stages,
  categories,
}: ReceivablesTableProps) => {
  const [selectedReceivableForSettle, setSelectedReceivableForSettle] = useState<ReceivableDto | null>(null);
  const [selectedReceivableForSheet, setSelectedReceivableForSheet] = useState<ReceivableDto | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredReceivables = initialReceivables.filter((item) =>
    item.customerName.toLowerCase().includes(search.toLowerCase()) ||
    item.productNames.toLowerCase().includes(search.toLowerCase())
  );

  const getWhatsAppLink = (phone: string, customerName: string, amount: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const number = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const message = `Olá, ${customerName}! Tudo bem? Passando para lembrar da sua comanda em aberto no Rota 360 no valor de ${formatCurrency(amount)}. Qualquer dúvida estamos à disposição!`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  };

  const handleSettle = () => {
    if (!selectedReceivableForSettle) return;

    startTransition(async () => {
      try {
        const result = await settleReceivableAction({
          saleId: selectedReceivableForSettle.id,
          paymentMethod,
        });

        if (result?.serverError) throw new Error(result.serverError);

        toast.success(`Conta de ${selectedReceivableForSettle.customerName} liquidada com sucesso!`);
        setSelectedReceivableForSettle(null);
        router.refresh();
      } catch (err: any) {
        toast.error(`Erro ao dar baixa: ${err.message}`);
      }
    });
  };

  const handleOpenSaleDetails = (receivable: ReceivableDto) => {
    setSelectedReceivableForSheet(receivable);
    setIsSheetOpen(true);
  };

  const today = startOfDay(new Date());

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* TOTAL BAR */}
      <div className="flex items-center justify-between rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" />
          <span className="text-xs font-black uppercase tracking-widest text-orange-700">
            Comandas Aguardando Pagamento (Fiado)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total em Aberto:
          </span>
          <Badge variant="secondary" className="bg-background px-3 py-1 text-sm font-black text-orange-600 border border-orange-200 shadow-sm">
            {formatCurrency(initialReceivables.reduce((acc, curr) => acc + curr.totalAmount, 0))}
          </Badge>
        </div>
      </div>

      {/* CARDS GRID */}
      {filteredReceivables.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredReceivables.map((item) => {
            const dueDateObj = item.dueDate ? new Date(item.dueDate) : null;
            const isOverdue = dueDateObj ? isBefore(startOfDay(dueDateObj), today) : false;

            return (
              <Card
                key={item.id}
                onClick={() => handleOpenSaleDetails(item)}
                className={cn(
                  "group relative cursor-pointer overflow-hidden border-border bg-background transition-all hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]",
                  isOverdue && "border-rose-500 shadow-rose-50 ring-1 ring-rose-500/20"
                )}
              >
                {isOverdue && (
                  <div className="absolute right-0 top-0 rounded-bl-xl bg-rose-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                    Atrasado
                  </div>
                )}

                <div className="p-5">
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <ExpandableAvatar
                        imageUrl={item.customerImageUrl}
                        name={item.customerName}
                        className="h-9 w-9 rounded-xl"
                        iconSize={16}
                      />
                      <div className="flex flex-col">
                        <h3 className="line-clamp-1 pr-2 text-sm font-black uppercase italic tracking-tighter text-foreground">
                          {item.customerName}
                        </h3>
                        <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                          <Calendar size={10} />
                          {format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="flex items-center gap-1 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                        <ShoppingBag size={12} />
                        Itens
                      </span>
                      <p className="text-xs font-bold text-muted-foreground line-clamp-1">
                        {item.productNames || "Sem itens"}
                      </p>
                    </div>

                    <div className="space-y-1 text-right">
                      <span className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
                        Total a Pagar
                      </span>
                      <p className="text-lg font-black tracking-tighter text-orange-600">
                        {formatCurrency(item.totalAmount)}
                      </p>
                    </div>
                  </div>

                  {/* Vencimento e Ações */}
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        Vencimento
                      </span>
                      <p className={cn("text-xs font-black", isOverdue ? "text-rose-600" : "text-emerald-600")}>
                        {dueDateObj ? format(dueDateObj, "dd/MM/yyyy", { locale: ptBR }) : "Sem data"}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.customerPhone && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 gap-1 rounded-xl border border-emerald-600/30 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold tracking-tight shadow-sm transition-all"
                        >
                          <a href={getWhatsAppLink(item.customerPhone, item.customerName, item.totalAmount)} target="_blank" rel="noopener noreferrer">
                            <MessageCircle size={14} className="fill-emerald-600 text-emerald-600" />
                            <span className="text-[10px] font-extrabold">Cobrar</span>
                          </a>
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReceivableForSettle(item);
                          setPaymentMethod("PIX");
                        }}
                        className="h-8 gap-1 rounded-xl bg-primary text-background font-black uppercase italic tracking-wider text-[10px] shadow-md hover:bg-primary/90 transition-all active:scale-95"
                      >
                        <CheckCircle2 size={13} />
                        Dar Baixa
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-muted/30 text-center">
          <div className="mb-4 rounded-full bg-muted p-6 text-muted-foreground">
            <Clock size={48} className="text-orange-500" />
          </div>
          <h3 className="text-xl font-black uppercase italic tracking-tighter text-muted-foreground">
            {search ? "Nenhum resultado" : "Sem Comandas Pendentes"}
          </h3>
          <p className="mt-1 max-w-[300px] text-xs font-bold leading-relaxed text-muted-foreground/80">
            {search
              ? "Nenhum cliente ou item corresponde à busca."
              : "Não há comandas aguardando pagamento no momento."}
          </p>
        </div>
      )}

      {/* DIALOG DE BAIXA FINANCEIRA */}
      <Dialog open={!!selectedReceivableForSettle} onOpenChange={(open) => !open && setSelectedReceivableForSettle(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground">
              Liquidar Comanda Pendente
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Confirme a liquidação da comanda de <span className="font-extrabold text-foreground">{selectedReceivableForSettle?.customerName}</span> no valor de <span className="font-extrabold text-primary">{selectedReceivableForSettle ? formatCurrency(selectedReceivableForSettle.totalAmount) : "R$ 0,00"}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6 space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Método de Pagamento Recebido
            </Label>
            <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
              <SelectTrigger className="h-12 rounded-xl border-border bg-background font-bold shadow-sm focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={5}>
                {Object.entries(paymentMethodsConfig).map(([key, { label, icon }]) => (
                  <SelectItem key={key} value={key} className="my-1 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      {icon}
                      <span className="font-bold">{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <Button
              variant="ghost"
              onClick={() => setSelectedReceivableForSettle(null)}
              disabled={isPending}
              className="h-10 rounded-xl font-bold hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSettle}
              disabled={isPending}
              className="h-10 rounded-xl bg-emerald-600 px-6 font-black uppercase italic tracking-wider text-background shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
            >
              {isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                "Confirmar Baixa"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SHEET DE VISUALIZAÇÃO DA COMANDA PENDENTE */}
      <Sheet 
        open={isSheetOpen} 
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setSelectedReceivableForSheet(null);
        }}
      >
        {selectedReceivableForSheet && (
          <UpsertSheetContent
            saleId={selectedReceivableForSheet.id}
            saleDate={selectedReceivableForSheet.date}
            customerId={selectedReceivableForSheet.customerId}
            paymentMethod={selectedReceivableForSheet.paymentMethod || undefined}
            tipAmount={Number(selectedReceivableForSheet.tipAmount)}
            defaultDiscountAmount={Number(selectedReceivableForSheet.discountAmount || 0)}
            defaultExtraAmount={Number(selectedReceivableForSheet.extraAmount || 0)}
            defaultAdjustmentReason={selectedReceivableForSheet.adjustmentReason || ""}
            defaultIsEmployeeSale={selectedReceivableForSheet.isEmployeeSale || false}
            isOpen={isSheetOpen}
            productOptions={productOptions}
            customerOptions={customerOptions}
            products={products}
            setSheetIsOpen={setIsSheetOpen}
            companyId={companyId}
            stages={stages}
            categories={categories}
            isReadOnly={true}
            defaultSelectedProducts={selectedReceivableForSheet.saleItems.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              return {
                productId: item.productId,
                quantity: Number(item.quantity),
                name: item.product.name,
                price: Number(item.unitPrice),
                cost: Number(item.baseCost || 0),
                operationalCost: Number(item.operationalCost || 0),
                stock: product?.stock ?? 0,
              };
            })}
          />
        )}
      </Sheet>
    </div>
  );
};
