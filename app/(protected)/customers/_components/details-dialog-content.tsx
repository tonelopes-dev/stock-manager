"use client";

import { useState, useTransition } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
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
  Trash2,
} from "lucide-react";
import { SalesTimeline } from "./sales-timeline";
import { format } from "date-fns/format";
import { MultiSelect } from "@/app/_components/ui/multi-select";
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
import { deleteCustomer } from "@/app/_actions/customer/delete-customer";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";

interface CustomerDetailsDialogContentProps {
  customer: any;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  onDelete?: (id: string) => void;
  onUpdate?: (customer: any) => void;
}

export const CustomerDetailsDialogContent = ({
  customer,
  categories,
  stages,
  onDelete,
  onUpdate,
}: CustomerDetailsDialogContentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email || "",
    phone: customer.phone || "",
    categoryIds: customer.categories?.map((c: any) => c.id) || [],
    stageId: customer.stageId || "NONE",
    notes: customer.notes || "",
    birthday: customer.birthday
      ? format(new Date(customer.birthday), "yyyy-MM-dd")
      : "",
  });

  const handleSave = () => {
    startTransition(async () => {
      const result = await upsertCustomer({
        id: customer.id,
        ...formData,
        categoryIds: formData.categoryIds,
        stageId: formData.stageId === "NONE" ? undefined : formData.stageId,
      });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao atualizar cliente.");
      } else {
        toast.success("Cliente atualizado!");
        if (onUpdate) {
          onUpdate({
            ...customer,
            ...formData,
            birthday: formData.birthday
              ? new Date(formData.birthday).toISOString()
              : null,
            categories: categories.filter((c) =>
              formData.categoryIds.includes(c.id),
            ),
          });
        }
        setIsEditing(false);
      }
    });
  };

  const handleConfirmDelete = () => {
    startTransition(async () => {
      onDelete?.(customer.id);
      const result = await deleteCustomer({ id: customer.id });

      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao excluir cliente.");
      } else {
        toast.success("Cliente excluído com sucesso!");
      }
    });
  };

  return (
    <>
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-none bg-white p-0 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
              <User className="h-6 w-6 text-primary" />
              {isEditing ? "Editar Cliente" : customer.name}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
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
                        Categorias
                      </label>
                      <MultiSelect
                        options={categories}
                        selected={formData.categoryIds}
                        onChange={(ids) =>
                          setFormData({ ...formData, categoryIds: ids })
                        }
                        placeholder="Categorias"
                      />
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
                    {customer.categories && customer.categories.length > 0 ? (
                      customer.categories.map((c: any) => (
                        <Badge
                          key={c.id}
                          variant="secondary"
                          style={
                            c.color
                              ? {
                                  backgroundColor: `${c.color}20`,
                                  color: c.color,
                                }
                              : undefined
                          }
                          className="text-[10px] font-black uppercase"
                        >
                          {c.name}
                        </Badge>
                      ))
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
                {isEditing ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      Aniversário
                    </label>
                    <Input
                      type="date"
                      value={formData.birthday}
                      onChange={(e) =>
                        setFormData({ ...formData, birthday: e.target.value })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Aniversário
                      </p>
                      <p className="text-sm font-medium text-slate-600">
                        {customer.birthday
                          ? format(
                              new Date(customer.birthday),
                              "dd 'de' MMMM",
                              {
                                locale: ptBR,
                              },
                            )
                          : "Não informado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-slate-400">
                        Data de Cadastro
                      </p>
                      <p className="text-sm font-medium text-slate-600">
                        {customer.createdAt
                          ? format(
                              new Date(customer.createdAt),
                              "dd/MM/yyyy HH:mm",
                              {
                                locale: ptBR,
                              },
                            )
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                )}
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

        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-slate-100 bg-white/80 px-6 py-4 backdrop-blur-md">
          <div>
            {!isEditing && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button size="sm" variant="outline" className="border-slate-200">
              Fechar
            </Button>
          </DialogClose>
        </div>
      </DialogContent>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem absoluta certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o
              cliente "{customer.name}" e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
