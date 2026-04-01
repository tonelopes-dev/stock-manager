"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/app/_components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/_components/ui/dropdown-menu";
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
  ListChecks,
  Loader2Icon,
  Plus,
  Sparkles,
  Bell,
  Clock,
  Check,
  Loader2,
  Calendar as CalendarIcon,
} from "lucide-react";
import { SalesTimeline } from "./sales-timeline";
import { CustomerChecklist } from "./customer-checklist";
import { getCustomerAction } from "@/app/_actions/customer/get-customer";
import { format } from "date-fns/format";
import { MultiSelect } from "@/app/_components/ui/multi-select";
import { ptBR } from "date-fns/locale";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { parseISO } from "date-fns";
import {
  applyChecklistTemplate,
  createChecklist,
} from "@/app/_actions/checklist";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { updateCustomerBirthdayReminder } from "@/app/_actions/crm/update-birthday-reminder";
import { setHours, setMinutes, isPast } from "date-fns";
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
import { upsertCustomer } from "@/app/_actions/customer/upsert-customer";
import { deleteCustomer } from "@/app/_actions/customer/delete-customer";
import { Textarea } from "@/app/_components/ui/textarea";

// Helper to handle date strings/objects from Prisma/Server correctly in local time
// avoiding the "one day off" bug due to UTC vs Local shifts (especially common in birthdays)
const getSafeDate = (dateInput: string | Date | null | undefined): Date | undefined => {
  if (!dateInput) return undefined;
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return undefined;

  // For birthdays, we treat the UTC date components as local ones
  // e.g., 2026-03-04T00:00:00Z becomes 2026-03-04 Local midnight
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
};

interface CustomerDetailsDialogContentProps {
  customer: any;
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
  checklistTemplates: any[];
  onDelete?: (id: string) => void;
  onUpdate?: (customer: any) => void;
}

export const CustomerDetailsDialogContent = ({
  customer,
  categories,
  stages,
  checklistTemplates,
  onDelete,
  onUpdate,
}: CustomerDetailsDialogContentProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: customer.name,
    email: customer.email || "",
    phoneNumber: customer.phoneNumber || "",
    categoryIds: customer.categories?.map((c: any) => c.id) || [],
    stageId: customer.stageId || "NONE",
    notes: customer.notes || "",
    birthDate: customer.birthDate
      ? format(new Date(customer.birthDate), "yyyy-MM-dd")
      : "",
  });

  const [fullCustomer, setFullCustomer] = useState(customer);
  const [isLoadingFull, setIsLoadingFull] = useState(false);

  const fetchFullCustomer = useCallback(async () => {
    setIsLoadingFull(true);
    const result = await getCustomerAction({ id: customer.id });
    if (result?.data) {
      setFullCustomer(result.data);
    }
    setIsLoadingFull(false);
  }, [customer.id]);

  useEffect(() => {
    fetchFullCustomer();
  }, [fetchFullCustomer]);

  const handleApplyTemplate = (templateId: string) => {
    startTransition(async () => {
      const result = await applyChecklistTemplate({
        customerId: customer.id,
        templateId,
      });
      if (result?.serverError) {
        toast.error("Erro ao aplicar template.");
      } else {
        toast.success("Jornada aplicada!");
        fetchFullCustomer();
      }
    });
  };

  const handleCreateManualChecklist = () => {
    startTransition(async () => {
      const result = await createChecklist({
        customerId: customer.id,
        title: "Minha Jornada",
      });
      if (result?.serverError) {
        toast.error("Erro ao iniciar jornada.");
      } else {
        toast.success("Jornada iniciada!");
        fetchFullCustomer();
      }
    });
  };

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
            birthDate: formData.birthDate
              ? new Date(formData.birthDate).toISOString()
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
      <DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto border-none bg-background p-0 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/80 px-6 py-4 backdrop-blur-md">
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
                className="gap-2 border-border"
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
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-foreground">
                      {customer.name}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {customer.email || "Sem e-mail"}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground">
                      {customer.phoneNumber || "Sem telefone"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Tag className="h-3 w-3" /> CRM & Pipeline
                </span>
                {isEditing ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
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
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">
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
                        className="text-[10px] font-bold text-muted-foreground"
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
                        className="text-[10px] font-bold text-muted-foreground"
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
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <Calendar className="h-3 w-3" /> Outros Detalhes
                </span>
                {isEditing ? (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">
                      Aniversário
                    </label>
                    <DatePicker
                      value={getSafeDate(formData.birthDate)}
                      onChange={(date) =>
                        setFormData({
                          ...formData,
                          birthDate: date ? format(date, "yyyy-MM-dd") : "",
                        })
                      }
                      showDropdowns={true}
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Aniversário
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {customer.birthDate
                          ? format(getSafeDate(customer.birthDate)!, "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "Não informado"}
                      </p>
                      <CustomerBirthdayReminder 
                        customer={customer} 
                        onUpdate={fetchFullCustomer} 
                      />
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground">
                        Data de Cadastro
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">
                        {customer.createdAt
                          ? format(new Date(customer.createdAt), "dd/MM/yyyy", {
                              locale: ptBR,
                            })
                          : "Não informado"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
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
                  <p className="whitespace-pre-wrap text-sm font-medium italic leading-relaxed text-muted-foreground">
                    {customer.notes || "Sem observações adicionais."}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-xs font-black uppercase italic tracking-tighter text-foreground">
                <ListChecks className="h-4 w-4" /> Jornada do Cliente
              </h3>

              {checklistTemplates.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 border-primary/20 bg-primary/5 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                      disabled={isPending}
                    >
                      <Plus className="h-3 w-3" /> Iniciar Jornada
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {checklistTemplates.map((t) => (
                      <DropdownMenuItem
                        key={t.id}
                        className="gap-2 text-xs font-medium"
                        onClick={() => handleApplyTemplate(t.id)}
                      >
                        <Sparkles className="h-3 w-3 text-primary" />
                        {t.name}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="gap-2 text-xs font-medium italic"
                      onClick={handleCreateManualChecklist}
                    >
                      <Plus className="h-3 w-3" /> Jornada Personalizada
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 border-primary/20 bg-primary/5 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                  disabled={isPending}
                  onClick={handleCreateManualChecklist}
                >
                  <Plus className="h-3 w-3" /> Iniciar Jornada
                </Button>
              )}
            </div>
            <CustomerChecklist
              customerId={customer.id}
              checklists={fullCustomer.checklists || []}
              templates={checklistTemplates}
              refreshData={fetchFullCustomer}
            />
          </div>

          <div className="mt-12 border-t border-border pt-8">
            <h3 className="mb-6 flex items-center gap-2 text-xs font-black uppercase italic tracking-tighter text-foreground">
              <ShoppingBag className="h-4 w-4" /> Histórico de Compras
            </h3>
            {isLoadingFull ? (
              <div className="flex items-center justify-center py-10">
                <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SalesTimeline sales={fullCustomer.sales || []} />
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-border bg-background/80 px-6 py-4 backdrop-blur-md">
          <div>
            {!isEditing && (
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <DialogClose asChild>
            <Button size="sm" variant="outline" className="border-border">
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
              className="bg-destructive hover:bg-destructive"
            >
              Excluir permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

interface CustomerBirthdayReminderProps {
  customer: any;
  onUpdate: () => void;
}

const CustomerBirthdayReminder = ({
  customer,
  onUpdate,
}: CustomerBirthdayReminderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    customer.birthdayReminderDate
      ? new Date(customer.birthdayReminderDate)
      : undefined,
  );
  const [hours, setHoursState] = useState(
    customer.birthdayReminderDate
      ? new Date(customer.birthdayReminderDate).getHours().toString().padStart(2, "0")
      : "09",
  );
  const [minutes, setMinutesState] = useState(
    customer.birthdayReminderDate
      ? new Date(customer.birthdayReminderDate).getMinutes().toString().padStart(2, "0")
      : "00",
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    let finalDate = date;
    if (finalDate) {
      finalDate = setHours(finalDate, parseInt(hours));
      finalDate = setMinutes(finalDate, parseInt(minutes));
    }

    setIsUpdating(true);
    try {
      await updateCustomerBirthdayReminder({
        id: customer.id,
        birthdayReminderDate: finalDate || null,
      });
      onUpdate();
      setIsOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue =
    customer.birthdayReminderDate && isPast(new Date(customer.birthdayReminderDate));

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className={`h-6 w-6 p-0 transition-all ${
            customer.birthdayReminderDate
              ? "text-primary hover:bg-primary/10"
              : "text-muted-foreground opacity-30 hover:opacity-100"
          }`}
        >
          <Bell
            className={`h-3 w-3 ${isOverdue ? "animate-pulse text-destructive" : ""}`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Lembrete de Aniversário
            </h4>
            <DatePicker value={date} onChange={setDate} />
          </div>

          <div className="flex items-center gap-2">
            <div className="grid flex-1 gap-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                Hora
              </label>
              <Input
                type="number"
                min="0"
                max="23"
                value={hours}
                onChange={(e) => setHoursState(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="grid flex-1 gap-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                Min
              </label>
              <Input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutesState(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 flex-1 text-[10px] font-bold uppercase"
              onClick={() => {
                setDate(undefined);
                handleSave();
              }}
              disabled={isUpdating}
            >
              Remover
            </Button>
            <Button
              size="sm"
              className="h-8 flex-1 text-[10px] font-bold uppercase"
              onClick={handleSave}
              disabled={isUpdating || !date}
            >
              {isUpdating ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
