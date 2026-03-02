"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Badge } from "@/app/_components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  MapPin,
  Notebook,
  ShoppingBag,
} from "lucide-react";
import { SalesTimeline } from "./sales-timeline";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";

interface CustomerDetailsDialogContentProps {
  customer: any;
}

export const CustomerDetailsDialogContent = ({
  customer,
}: CustomerDetailsDialogContentProps) => {
  return (
    <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
          <User className="h-6 w-6 text-primary" />
          {customer.name}
        </DialogTitle>
      </DialogHeader>

      <div className="mt-6 grid grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Mail className="h-3 w-3" /> Contato
            </span>
            <p className="truncate text-sm font-medium text-slate-600">
              {customer.email || "Sem e-mail"}
            </p>
            <p className="text-sm font-medium text-slate-600">
              {customer.phone || "Sem telefone"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Tag className="h-3 w-3" /> Categoria & Estágio
            </span>
            <div className="flex gap-2 pt-1">
              {customer.category && (
                <Badge
                  variant="secondary"
                  className="bg-slate-100 text-[10px] font-black uppercase text-slate-500"
                >
                  {customer.category.name}
                </Badge>
              )}
              {customer.stage && (
                <Badge
                  variant="outline"
                  className="border-primary/20 text-[10px] font-black uppercase text-primary"
                >
                  {customer.stage.name}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Calendar className="h-3 w-3" /> Aniversário
            </span>
            <p className="text-sm font-medium text-slate-600">
              {customer.birthday
                ? format(new Date(customer.birthday), "dd 'de' MMMM", {
                    locale: ptBR,
                  })
                : "Não informado"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
              <Notebook className="h-3 w-3" /> Observações
            </span>
            <p className="whitespace-pre-wrap text-sm font-medium italic leading-relaxed text-slate-600">
              {customer.notes || "Sem observações adicionais."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-slate-100 pt-6">
        <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase italic tracking-tighter text-slate-800">
          <ShoppingBag className="h-4 w-4" /> Histórico de Compras
        </h3>
        <SalesTimeline sales={customer.sales || []} />
      </div>
    </DialogContent>
  );
};
