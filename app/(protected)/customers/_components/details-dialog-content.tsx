"use client";

import { useState, useTransition } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/app/_components/ui/dialog";
import { Badge } from "@/app/_components/ui/badge";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Tag,
  Notebook,
  ShoppingBag,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { SalesTimeline } from "./sales-timeline";
import { format } from "date-fns/format";
import { ptBR } from "date-fns/locale";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Textarea } from "@/app/_components/ui/textarea";
import { upsertCustomer } from "@/app/_actions/customer/upsert-customer";
import { toast } from "sonner";

interface CustomerDetailsDialogContentProps {
  customer: any;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
}

export const CustomerDetailsDialogContent = ({
  customer,
  categories,
  stages,
}: CustomerDetailsDialogContentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email || "",
    phone: customer.phone || "",
    categoryId: customer.categoryId || "NONE",
    stageId: customer.stageId || "NONE",
    notes: customer.notes || "",
  });

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertCustomer({
        id: customer.id,
        ...formData,
        categoryId:
          formData.categoryId === "NONE" ? undefined : formData.categoryId,
        stageId: formData.stageId === "NONE" ? undefined : formData.stageId,
      });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao atualizar cliente.");
      } else {
        toast.success("Cliente atualizado!");
        setIsEditing(false);
      }
    });
  };

  return (
    <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-none bg-white p-0 shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
        <DialogHeader className="p-0">
          <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
            <User className="h-6 w-6 text-primary" />
            {isEditing ? "Editar Cliente" : customer.name}
          </DialogTitle>
        </DialogHeader>
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            className="gap-2 border-slate-200"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="h-3 w-3" /> Editar
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsEditing(false)}
              disabled={isPending}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isPending}>
              <Save className="mr-2 h-3 w-3" /> Salvar
            </Button>
          </div>
        )}
      </div>

      <div className="p-6">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Mail className="h-3 w-3" /> Informações Básicas
              </span>
              {isEditing ? (
                <div className="space-y-3">
                  <Input
                    placeholder="Nome"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                  <Input
                    placeholder="E-mail"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                  <Input
                    placeholder="Telefone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">
                    {customer.name}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    {customer.email || "Sem e-mail"}
                  </p>
                  <p className="text-sm font-medium text-slate-500">
                    {customer.phone || "Sem telefone"}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Tag className="h-3 w-3" /> CRM & Pipeline
              </span>
              {isEditing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Categoria
                    </label>
                    <Select
                      value={formData.categoryId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, categoryId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Nenhuma</SelectItem>
                        {categories.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Estágio
                    </label>
                    <Select
                      value={formData.stageId}
                      onValueChange={(v) =>
                        setFormData({ ...formData, stageId: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Estágio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">Nenhum</SelectItem>
                        {stages.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {customer.category ? (
                    <Badge
                      variant="secondary"
                      className="bg-slate-100 text-[10px] font-black uppercase text-slate-500"
                    >
                      {customer.category.name}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold text-slate-300"
                    >
                      Sem Categoria
                    </Badge>
                  )}
                  {customer.stage ? (
                    <Badge
                      variant="outline"
                      className="border-primary/20 text-[10px] font-black uppercase text-primary"
                    >
                      {customer.stage.name}
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-bold text-slate-300"
                    >
                      Sem Estágio
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Calendar className="h-3 w-3" /> Outros Detalhes
              </span>
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase text-slate-400">
                  Aniversário
                </p>
                <p className="text-sm font-medium text-slate-600">
                  {customer.birthday
                    ? format(new Date(customer.birthday), "dd 'de' MMMM", {
                        locale: ptBR,
                      })
                    : "Não informado"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <Notebook className="h-3 w-3" /> Observações
              </span>
              {isEditing ? (
                <Textarea
                  placeholder="Notas internas sobre o cliente..."
                  className="min-h-[120px] resize-none text-sm"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                />
              ) : (
                <p className="whitespace-pre-wrap text-sm font-medium italic leading-relaxed text-slate-600">
                  {customer.notes || "Sem observações adicionais."}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-100 pt-8">
          <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase italic tracking-tighter text-slate-800">
            <ShoppingBag className="h-4 w-4" /> Histórico de Compras
          </h3>
          <SalesTimeline sales={customer.sales || []} />
        </div>
      </div>
    </DialogContent>
  );
};
