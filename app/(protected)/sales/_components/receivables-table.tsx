"use client";

import { ReceivableDto } from "@/app/_data-access/sale/get-pending-receivables";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { Button } from "@/app/_components/ui/button";
import { formatCurrency } from "@/app/_utils/currency";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, MessageCircle, DollarSign, Smartphone, CreditCard, Wallet } from "lucide-react";
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
}

export const ReceivablesTable = ({ initialReceivables, search = "" }: ReceivablesTableProps) => {
  const [selectedReceivable, setSelectedReceivable] = useState<ReceivableDto | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredReceivables = initialReceivables.filter((item) =>
    item.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const getWhatsAppLink = (phone: string, customerName: string, amount: number) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const number = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    const message = `Olá, ${customerName}! Tudo bem? Passando para lembrar da sua comanda em aberto no Rota 360 no valor de ${formatCurrency(amount)}. Qualquer dúvida estamos à disposição!`;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  };

  const handleSettle = () => {
    if (!selectedReceivable) return;

    startTransition(async () => {
      try {
        const result = await settleReceivableAction({
          saleId: selectedReceivable.id,
          paymentMethod,
        });

        if (result?.serverError) throw new Error(result.serverError);

        toast.success(`Conta de ${selectedReceivable.customerName} liquidada com sucesso!`);
        setSelectedReceivable(null);
        router.refresh();
      } catch (err: any) {
        toast.error(`Erro ao dar baixa: ${err.message}`);
      }
    });
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

      {/* TABLE */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-background shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Cliente</TableHead>
              <TableHead className="py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Telefone</TableHead>
              <TableHead className="py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Data da Venda</TableHead>
              <TableHead className="py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Vencimento</TableHead>
              <TableHead className="py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Valor Total</TableHead>
              <TableHead className="py-4 text-xs font-black uppercase tracking-wider text-muted-foreground">Status</TableHead>
              <TableHead className="py-4 text-right text-xs font-black uppercase tracking-wider text-muted-foreground">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceivables.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-muted-foreground font-bold italic">
                  {search ? "Nenhum cliente encontrado." : "Nenhuma comanda pendente de pagamento."}
                </TableCell>
              </TableRow>
            ) : (
              filteredReceivables.map((item) => {
                const dueDateObj = item.dueDate ? new Date(item.dueDate) : null;
                const isOverdue = dueDateObj ? isBefore(startOfDay(dueDateObj), today) : false;

                return (
                  <TableRow key={item.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <ExpandableAvatar
                          imageUrl={item.customerImageUrl}
                          name={item.customerName}
                          className="h-9 w-9 rounded-full"
                        />
                        <span className="font-extrabold uppercase italic text-foreground">
                          {item.customerName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground py-4">
                      {item.customerPhone || "Sem telefone"}
                    </TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground py-4">
                      {format(new Date(item.date), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className={cn("text-xs font-black py-4", isOverdue ? "text-rose-600" : "text-emerald-600")}>
                      {dueDateObj ? format(dueDateObj, "dd/MM/yyyy", { locale: ptBR }) : "Sem data"}
                    </TableCell>
                    <TableCell className="text-sm font-black text-foreground py-4">
                      {formatCurrency(item.totalAmount)}
                    </TableCell>
                    <TableCell className="py-4">
                      {isOverdue ? (
                        <Badge variant="destructive" className="animate-pulse bg-rose-500 font-black uppercase tracking-wider text-[10px] shadow-sm">
                          Atrasado
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border border-emerald-200 font-black uppercase tracking-wider text-[10px]">
                          No Prazo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {item.customerPhone && (
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-8 gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 font-bold tracking-tight shadow-sm transition-all"
                          >
                            <a href={getWhatsAppLink(item.customerPhone, item.customerName, item.totalAmount)} target="_blank" rel="noopener noreferrer">
                              <MessageCircle size={14} className="fill-emerald-600 text-emerald-600" />
                              <span className="text-xs">Cobrar</span>
                            </a>
                          </Button>
                        )}
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => {
                            setSelectedReceivable(item);
                            setPaymentMethod("PIX");
                          }}
                          className="h-8 gap-1.5 rounded-xl bg-primary text-background font-black uppercase italic tracking-wider shadow-md hover:bg-primary/90 transition-all active:scale-95"
                        >
                          <CheckCircle2 size={14} />
                          Dar Baixa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* DIALOG DE BAIXA FINANCEIRA */}
      <Dialog open={!!selectedReceivable} onOpenChange={(open) => !open && setSelectedReceivable(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-border bg-background p-6 shadow-2xl">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black uppercase italic tracking-tighter text-foreground">
              Liquidar Comanda Pendente
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-muted-foreground">
              Confirme a liquidação da comanda de <span className="font-extrabold text-foreground">{selectedReceivable?.customerName}</span> no valor de <span className="font-extrabold text-primary">{selectedReceivable ? formatCurrency(selectedReceivable.totalAmount) : "R$ 0,00"}</span>.
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
              onClick={() => setSelectedReceivable(null)}
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
    </div>
  );
};
