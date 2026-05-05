"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogTrigger,
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
  XIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
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
import { getWhatsAppUrl } from "@/app/_lib/utils";

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

// Helper to format phone number to (99) 99999-9999
const formatPhoneNumber = (value: string) => {
  if (!value) return "";
  const phoneNumber = value.replace(/[^\d]/g, "");
  const phoneNumberLength = phoneNumber.length;
  
  if (phoneNumberLength <= 2) return phoneNumber;
  if (phoneNumberLength <= 7) {
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
  }
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(
    2,
    7
  )}-${phoneNumber.slice(7, 11)}`;
};

// Helper to validate email format
const validateEmail = (email: string) => {
  if (!email) return true; // Empty email is handled by the backend if required
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
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
  const [isImageOpen, setIsImageOpen] = useState(false);

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
    // Basic validation
    if (formData.email && !validateEmail(formData.email)) {
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("O nome do cliente é obrigatório.");
      return;
    }

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
      <DialogContent className="flex max-h-[90vh] max-w-6xl flex-col border-none bg-background p-0 shadow-2xl">
        {/* Fixed Header */}
        <div className="flex items-center justify-between border-b border-border bg-background px-6 py-4 pr-14">
          <DialogHeader className="p-0">
            <DialogTitle className="flex items-center gap-3 text-xl font-black uppercase italic tracking-tighter">
              <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
                <DialogTrigger asChild>
                  <div className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-primary/10 border border-primary/5 transition-all hover:scale-110 active:scale-95 shadow-sm">
                    {fullCustomer.imageUrl ? (
                      <img 
                        src={fullCustomer.imageUrl} 
                        alt={fullCustomer.name} 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </DialogTrigger>
                {customer.imageUrl && (
                  <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-[500px] [&>button]:text-white [&>button]:bg-black/20 [&>button]:backdrop-blur-sm [&>button]:rounded-full [&>button]:p-1 [&>button]:hover:bg-black/40 [&>button]:border [&>button]:border-white/20 [&>button]:transition-all">
                    <DialogTitle className="sr-only">Foto do Cliente: {customer.name}</DialogTitle>
                    <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
                      <img
                        src={customer.imageUrl}
                        alt={customer.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </DialogContent>
                )}
              </Dialog>
              <div className="flex flex-col text-left">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Detalhes do Cliente</span>
                {isEditing ? "Editar Registro" : fullCustomer.name}
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              {!isEditing ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-border"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Editar informações do cliente</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    disabled={isPending}
                  >
                    <X className="mr-2 h-4 w-4" /> Cancelar
                  </Button>
                  
                  <Button size="sm" onClick={handleSave} disabled={isPending}>
                    <Save className="mr-2 h-3 w-3" /> Salvar Alterações
                  </Button>
                </div>
              )}
            </TooltipProvider>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="grid flex-1 grid-cols-1 lg:grid-cols-12">
            {/* Left Column: Basic Info & Details (Independent Scroll) */}
            <div className="h-full overflow-y-auto border-r border-border/50 bg-muted/5 p-6 lg:col-span-4">
              <div className="space-y-8">
                {/* Basic Info Section */}
                <div className="space-y-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Mail className="h-3 w-3 text-primary" /> Informações de Contato
                  </span>
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Nome Completo</label>
                        <Input
                          placeholder="Nome Completo"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">E-mail</label>
                        <Input
                          placeholder="exemplo@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className={formData.email && !validateEmail(formData.email) ? "border-destructive focus-visible:ring-destructive" : ""}
                        />
                        {formData.email && !validateEmail(formData.email) && (
                          <p className="text-[10px] font-medium text-destructive">Formato de e-mail inválido</p>
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">WhatsApp / Celular</label>
                        <Input
                          placeholder="(00) 00000-0000"
                          value={formData.phoneNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              phoneNumber: formatPhoneNumber(e.target.value),
                            })
                          }
                          maxLength={15}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-xl border border-border/50 bg-muted/30 p-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Nome</p>
                        <p className="text-sm font-semibold">{fullCustomer.name}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">E-mail</p>
                        <p className="text-sm font-medium">{fullCustomer.email || "—"}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">WhatsApp</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">{fullCustomer.phoneNumber || "—"}</p>
                          {fullCustomer.phoneNumber && (
                            <a 
                              href={getWhatsAppUrl(fullCustomer.phoneNumber)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex h-7 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 shadow-sm transition-all hover:bg-emerald-50 hover:shadow-md"
                            >
                              <svg 
                                viewBox="0 0 24 24" 
                                width="14" 
                                height="14" 
                                fill="currentColor"
                              >
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                              </svg>
                              <span>Abrir Conversa</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CRM Section */}
                <div className="space-y-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Tag className="h-3 w-3 text-primary" /> CRM & Funil
                  </span>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Categorias</label>
                        <MultiSelect
                          options={categories}
                          selected={formData.categoryIds}
                          onChange={(ids) =>
                            setFormData({ ...formData, categoryIds: ids })
                          }
                          placeholder="Selecionar categorias..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Estágio Atual</label>
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
                      {fullCustomer.categories && fullCustomer.categories.length > 0 ? (
                        fullCustomer.categories.map((c: any) => (
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
                        <Badge variant="outline" className="text-[10px] font-bold text-muted-foreground">Sem Categoria</Badge>
                      )}
                      {fullCustomer.stage && (
                        <Badge variant="outline" className="border-primary/20 text-[10px] font-black uppercase text-primary">
                          {fullCustomer.stage.name}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Important Dates */}
                <div className="space-y-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Calendar className="h-3 w-3 text-primary" /> Datas Importantes
                  </span>
                  {isEditing ? (
                    <div className="grid grid-cols-1 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-muted-foreground">Data de Aniversário</label>
                        <DatePicker
                          value={getSafeDate(formData.birthDate)}
                          onChange={(date) =>
                            setFormData({
                              ...formData,
                              birthDate: date ? format(date, "yyyy-MM-dd") : "",
                            })
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/20 p-3">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">Data de Cadastro</span>
                        <span className="text-xs font-semibold">
                          {customer.createdAt
                            ? format(new Date(customer.createdAt), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Aniversário</p>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">
                            {fullCustomer.birthDate
                              ? format(getSafeDate(fullCustomer.birthDate)!, "dd/MM", { locale: ptBR })
                              : "—"}
                          </p>
                          <CustomerBirthdayReminder 
                            customer={fullCustomer} 
                            onUpdate={fetchFullCustomer} 
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Cadastro</p>
                        <p className="text-sm font-medium">
                          {fullCustomer.createdAt
                            ? format(new Date(fullCustomer.createdAt), "dd/MM/yyyy", { locale: ptBR })
                            : "—"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes Section */}
                <div className="space-y-4">
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <Notebook className="h-3 w-3 text-primary" /> Observações Internas
                  </span>
                  {isEditing ? (
                    <Textarea
                      placeholder="Notas internas sobre este cliente..."
                      className="min-h-[100px] resize-none text-sm"
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                    />
                  ) : (
                    <p className="rounded-lg border border-border/50 bg-muted/30 p-3 text-xs font-medium italic leading-relaxed text-muted-foreground">
                      {fullCustomer.notes || "Nenhuma observação interna registrada."}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Journey & Sales (Independent Scroll) */}
            <div className="h-full overflow-y-auto p-6 lg:col-span-8">
              <div className="space-y-10">
                {/* Journey Section */}
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-foreground">
                      <ListChecks className="h-4 w-4 text-primary" /> Jornada de Sucesso
                    </h3>

                    {checklistTemplates.length > 0 ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1.5 border-primary/20 bg-primary/5 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                            disabled={isPending}
                          >
                            <Plus className="h-3 w-3" /> Nova Etapa
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                          <div className="px-2 py-1.5 text-[10px] font-black uppercase text-muted-foreground">Aplicar Template</div>
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
                            <Plus className="h-3 w-3" /> Iniciar Customizada
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1.5 border-primary/20 bg-primary/5 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                        disabled={isPending}
                        onClick={handleCreateManualChecklist}
                      >
                        <Plus className="h-3 w-3" /> Iniciar Jornada
                      </Button>
                    )}
                  </div>
                  <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
                    <CustomerChecklist
                      customerId={customer.id}
                      checklists={fullCustomer.checklists || []}
                      templates={checklistTemplates}
                      refreshData={fetchFullCustomer}
                    />
                  </div>
                </div>

                {/* Sales Section */}
                <div className="pt-4">
                  <h3 className="mb-6 flex items-center gap-2 text-sm font-black uppercase italic tracking-tighter text-foreground">
                    <ShoppingBag className="h-4 w-4 text-primary" /> Histórico de Vendas
                  </h3>
                  <div className="rounded-xl border border-border/50 bg-muted/10 p-4">
                    {isLoadingFull ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : (
                      <SalesTimeline sales={fullCustomer.sales || []} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex items-center justify-between border-t border-border bg-background px-6 py-4">
          <div>
            {!isEditing && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>Excluir cliente</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <DialogClose asChild>
            <Button size="sm" variant="outline" className="border-border">
              Fechar Detalhes
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
    <TooltipProvider>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 w-6 p-0 transition-all group/bell ${
                  customer.birthdayReminderDate
                    ? "opacity-100 hover:bg-primary/10"
                    : "text-muted-foreground opacity-30 hover:opacity-100 hover:bg-primary/10"
                }`}
              >
                <Bell
                  className={`h-3 w-3 transition-colors ${
                    isOverdue 
                      ? "animate-pulse text-destructive" 
                      : customer.birthdayReminderDate 
                        ? "text-emerald-500 group-hover/bell:text-primary" 
                        : "group-hover/bell:text-primary"
                  }`}
                />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>{customer.birthdayReminderDate ? "Ver detalhes do lembrete" : "Agendar lembrete de aniversário"}</p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-64 rounded-xl border-none p-4 shadow-2xl" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <span className="text-xs font-black uppercase italic tracking-tighter">
                  Lembrete de Aniversário
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:bg-muted"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-muted-foreground">
                Data do Alerta
              </label>
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
              {customer.birthdayReminderDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 flex-1 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
                  onClick={() => {
                    setDate(undefined);
                    handleSave();
                  }}
                  disabled={isUpdating}
                >
                  Remover
                </Button>
              )}
              <Button
                size="sm"
                className="h-8 flex-1 text-[10px] font-bold uppercase"
                onClick={handleSave}
                disabled={isUpdating || !date}
              >
                {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
};
