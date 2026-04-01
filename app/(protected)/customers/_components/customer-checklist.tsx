"use client";

import { useState, useTransition } from "react";
import { Checklist, ChecklistItem, ChecklistTemplate } from "@prisma/client";
import { Progress } from "@/app/_components/ui/progress";
import { Checkbox } from "@/app/_components/ui/checkbox";
import { Button } from "@/app/_components/ui/button";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Sparkles,
  Pencil,
  Check,
  Loader2,
  Bell,
  Calendar as CalendarIcon,
  Clock,
  Info,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { format, setHours, setMinutes, getHours, getMinutes, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import {
  toggleChecklistItem,
  applyChecklistTemplate,
  deleteChecklist,
  createChecklist,
  createChecklistItem,
  updateChecklistItemTitle,
  deleteChecklistItem,
  updateChecklistTitle,
  updateChecklistItemDueDate,
} from "@/app/_actions/checklist";
import { Input } from "@/app/_components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CustomerChecklistProps {
  customerId: string;
  checklists: (Checklist & { items: ChecklistItem[] })[];
  templates: ChecklistTemplate[];
  refreshData?: () => void;
}

export const CustomerChecklist = ({
  customerId,
  checklists,
  templates,
  refreshData,
}: CustomerChecklistProps) => {
  const [isPending, startTransition] = useTransition();
  const [expandedChecklists, setExpandedChecklists] = useState<string[]>(
    checklists.map((c) => c.id),
  );
  const [newItemTitles, setNewItemTitles] = useState<Record<string, string>>(
    {},
  );
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [deletingChecklistId, setDeletingChecklistId] = useState<string | null>(
    null,
  );
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [editingTitleChecklistId, setEditingTitleChecklistId] = useState<
    string | null
  >(null);
  const [editingChecklistTitle, setEditingChecklistTitle] = useState("");
  const [togglingItemIds, setTogglingItemIds] = useState<Set<string>>(
    new Set(),
  );

  const toggleExpand = (id: string) => {
    setExpandedChecklists((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleItem = (itemId: string, isChecked: boolean) => {
    setTogglingItemIds((prev) => new Set(prev).add(itemId));
    startTransition(async () => {
      const result = await toggleChecklistItem({ id: itemId, isChecked });
      if (result?.serverError) {
        toast.error("Erro ao atualizar item.");
      } else {
        refreshData?.();
      }
      setTogglingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    startTransition(async () => {
      const result = await applyChecklistTemplate({ customerId, templateId });
      if (result?.serverError) {
        toast.error("Erro ao aplicar template.");
      } else {
        toast.success("Jornada aplicada com sucesso!");
        refreshData?.();
      }
    });
  };

  const handleDeleteChecklist = (id: string) => {
    startTransition(async () => {
      const result = await deleteChecklist({ id });
      if (result?.serverError) {
        toast.error("Erro ao excluir checklist.");
      } else {
        toast.success("Checklist removido.");
        setDeletingChecklistId(null);
        refreshData?.();
      }
    });
  };

  const handleCreateManual = () => {
    startTransition(async () => {
      const result = await createChecklist({
        customerId,
        title: "Minha Jornada",
      });
      if (result?.serverError) {
        toast.error("Erro ao iniciar jornada.");
      } else {
        toast.success("Jornada iniciada com sucesso!");
        refreshData?.();
      }
    });
  };

  const handleAddItem = (checklistId: string) => {
    const title = newItemTitles[checklistId];
    if (!title || title.trim() === "") return;

    startTransition(async () => {
      const result = await createChecklistItem({ checklistId, title });
      if (result?.serverError) {
        toast.error("Erro ao adicionar item.");
      } else {
        setNewItemTitles((prev) => ({ ...prev, [checklistId]: "" }));
        refreshData?.();
      }
    });
  };

  const handleStartEditing = (item: ChecklistItem) => {
    setEditingItemId(item.id);
    setEditingTitle(item.title);
  };

  const handleUpdateTitle = (itemId: string) => {
    if (!editingTitle || editingTitle.trim() === "") {
      setEditingItemId(null);
      return;
    }

    startTransition(async () => {
      const result = await updateChecklistItemTitle({
        id: itemId,
        title: editingTitle,
      });
      if (result?.serverError) {
        toast.error("Erro ao atualizar título.");
      } else {
        setEditingItemId(null);
        refreshData?.();
      }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    startTransition(async () => {
      const result = await deleteChecklistItem({ id: itemId });
      if (result?.serverError) {
        toast.error("Erro ao excluir item.");
      } else {
        setDeletingItemId(null);
        refreshData?.();
      }
    });
  };

  const handleUpdateChecklistTitle = (id: string) => {
    if (!editingChecklistTitle || editingChecklistTitle.trim() === "") {
      setEditingTitleChecklistId(null);
      return;
    }

    startTransition(async () => {
      const result = await updateChecklistTitle({
        id,
        title: editingChecklistTitle,
      });
      if (result?.serverError) {
        toast.error("Erro ao atualizar título da jornada.");
      } else {
        setEditingTitleChecklistId(null);
        refreshData?.();
      }
    });
  };

  const handleStartEditingChecklist = (checklist: Checklist) => {
    setEditingTitleChecklistId(checklist.id);
    setEditingChecklistTitle(checklist.title);
  };

  return (
    <>
      <div className="space-y-6">
        {checklists.length === 0 && (
          <div className="rounded-xl border-2 border-dashed border-border bg-muted/50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-sm">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <h4 className="text-sm font-bold text-foreground">
              Nenhuma jornada iniciada
            </h4>
            <p className="mb-6 text-xs text-muted-foreground">
              Comece a acompanhar o progresso deste cliente aplicando um
              template.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {templates.length > 0 ? (
                templates.map((t) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    size="sm"
                    className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                    onClick={() => handleApplyTemplate(t.id)}
                    disabled={isPending}
                  >
                    <Sparkles className="h-3 w-3" /> {t.name}
                  </Button>
                ))
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 border-primary/20 bg-primary/5 text-primary hover:bg-primary/10"
                  onClick={handleCreateManual}
                  disabled={isPending}
                >
                  <Plus className="h-3 w-3" /> Jornada Personalizada
                </Button>
              )}
            </div>
          </div>
        )}

        {checklists.map((checklist) => {
          const total = checklist.items.length;
          const checked = checklist.items.filter(
            (i: ChecklistItem) => i.isChecked,
          ).length;
          const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
          const isExpanded = expandedChecklists.includes(checklist.id);

          return (
            <div
              key={checklist.id}
              className="overflow-hidden rounded-xl border border-border bg-background shadow-sm"
            >
              {/* HEADER */}
              <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground"
                    onClick={() => toggleExpand(checklist.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    {editingTitleChecklistId === checklist.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          autoFocus
                          className="h-7 py-0 text-xs font-black uppercase italic tracking-tighter focus-visible:ring-1 focus-visible:ring-primary"
                          value={editingChecklistTitle}
                          onChange={(e) =>
                            setEditingChecklistTitle(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              handleUpdateChecklistTitle(checklist.id);
                            if (e.key === "Escape")
                              setEditingTitleChecklistId(null);
                          }}
                        />
                        <Button
                          size="sm"
                          className="h-6 w-6 rounded-full bg-primary p-0 text-background shadow-lg shadow-primary/20 transition-all hover:scale-110 hover:bg-primary/90 active:scale-95"
                          onClick={() =>
                            handleUpdateChecklistTitle(checklist.id)
                          }
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    ) : (
                      <div className="group/title flex items-center gap-2">
                        <h4 className="text-xs font-black uppercase italic tracking-tighter text-foreground">
                          {checklist.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover/title:opacity-100"
                          onClick={() => handleStartEditingChecklist(checklist)}
                        >
                          <Pencil className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black italic text-primary">
                      {progress}%
                    </span>
                    <Progress
                      value={progress}
                      className="h-1.5 w-16 bg-muted"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive/10 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeletingChecklistId(checklist.id)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* ITEMS LIST */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-4"
                  >
                    <div className="space-y-1">
                      {checklist.items.length === 0 && (
                        <p className="py-2 text-center text-[10px] italic text-muted-foreground">
                          Checklist vazio
                        </p>
                      )}
                      {checklist.items
                        .sort(
                          (a: ChecklistItem, b: ChecklistItem) =>
                            a.order - b.order,
                        )
                        .map((item: ChecklistItem) => {
                          const isOverdue = item.dueDate && isPast(new Date(item.dueDate)) && !item.isChecked;
                          return (
                            <div
                              key={item.id}
                              className="group flex items-center gap-3 rounded-lg px-2 py-1 transition-colors hover:bg-muted"
                            >
                            {isOverdue && (
                              <div className="flex shrink-0 items-center justify-center rounded-full bg-destructive/10 p-0.5 text-destructive animate-pulse">
                                <Info className="h-3 w-3" />
                              </div>
                            )}

                            <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                              {togglingItemIds.has(item.id) ? (
                                <Loader2 className="h-3 w-3 animate-spin text-primary" />
                              ) : (
                                <Checkbox
                                  id={item.id}
                                  checked={item.isChecked}
                                  onCheckedChange={(
                                    checked: boolean | "indeterminate",
                                  ) =>
                                    handleToggleItem(item.id, checked === true)
                                  }
                                  className="h-4 w-4 rounded-md border-border data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                                />
                              )}
                            </div>

                            {editingItemId === item.id ? (
                              <Input
                                autoFocus
                                className="h-7 py-0 text-sm focus-visible:ring-1 focus-visible:ring-primary"
                                value={editingTitle}
                                onChange={(e) =>
                                  setEditingTitle(e.target.value)
                                }
                                onBlur={() => handleUpdateTitle(item.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter")
                                    handleUpdateTitle(item.id);
                                  if (e.key === "Escape")
                                    setEditingItemId(null);
                                }}
                              />
                            ) : (
                              <div className="flex flex-1 items-center justify-between gap-2">
                                <label
                                  htmlFor={item.id}
                                  className={`flex-1 cursor-pointer text-sm font-medium transition-all duration-300 ${
                                    item.isChecked
                                      ? "text-muted-foreground line-through decoration-primary/40"
                                      : "text-muted-foreground"
                                  }`}
                                  onDoubleClick={() => handleStartEditing(item)}
                                >
                                  {item.title}
                                </label>
                                <div className="flex opacity-0 transition-opacity group-hover:opacity-100">
                                  <ChecklistItemReminder 
                                    item={item} 
                                    onUpdate={refreshData} 
                                  />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                                    onClick={() => handleStartEditing(item)}
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => handleDeleteItem(item.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                            );
                          })}

                      {/* ADD ITEM INPUT */}
                      <div className="mt-2 flex items-center gap-3 px-2">
                        <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <Input
                          placeholder="Adicionar tarefa..."
                          className="h-8 border-transparent bg-transparent px-0 text-sm shadow-none focus-visible:ring-0"
                          value={newItemTitles[checklist.id] || ""}
                          onChange={(e) =>
                            setNewItemTitles((prev) => ({
                              ...prev,
                              [checklist.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleAddItem(checklist.id);
                          }}
                        />
                        {newItemTitles[checklist.id]?.trim() && (
                          <Button
                            size="sm"
                            className="h-7 w-7 rounded-full bg-primary p-0 text-background shadow-lg shadow-primary/20 transition-all hover:scale-110 hover:bg-primary/90 active:scale-95"
                            onClick={() => handleAddItem(checklist.id)}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {checklists.length > 0 && templates.length > 0 && (
          <div className="flex justify-center pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-[10px] font-black uppercase text-muted-foreground hover:bg-primary/5 hover:text-primary"
              // This would open a template picker or just show them
            >
              <Plus className="h-3 w-3" /> Adicionar Outra Jornada
            </Button>
          </div>
        )}
      </div>
      {/* DELETE DIALOGS */}
      <AlertDialog
        open={!!deletingChecklistId}
        onOpenChange={(open) => !open && setDeletingChecklistId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Jornada?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente esta jornada e todos os seus
              itens.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive font-bold uppercase italic tracking-tighter hover:bg-destructive"
              onClick={(e) => {
                e.preventDefault();
                deletingChecklistId &&
                  handleDeleteChecklist(deletingChecklistId);
              }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir permanentemente"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deletingItemId}
        onOpenChange={(open) => !open && setDeletingItemId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Tarefa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive font-bold uppercase italic tracking-tighter hover:bg-destructive"
              onClick={(e) => {
                e.preventDefault();
                deletingItemId && handleDeleteItem(deletingItemId);
              }}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const ChecklistItemReminder = ({ 
  item, 
  onUpdate 
}: { 
  item: ChecklistItem; 
  onUpdate?: () => void;
}) => {
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    item.dueDate ? new Date(item.dueDate) : undefined
  );
  const [selectedTime, setSelectedTime] = useState(
    item.dueDate ? format(new Date(item.dueDate), "HH:mm") : "12:00"
  );
  const [isOpen, setIsOpen] = useState(false);

  const handleSave = () => {
    if (!selectedDate) return;

    const [hours, minutes] = selectedTime.split(":").map(Number);
    const finalDate = setMinutes(setHours(selectedDate, hours), minutes);

    startTransition(async () => {
      const result = await updateChecklistItemDueDate({
        id: item.id,
        dueDate: finalDate,
      });

      if (result?.serverError) {
        toast.error("Erro ao definir lembrete.");
      } else {
        toast.success("Lembrete definido!");
        setIsOpen(false);
        onUpdate?.();
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await updateChecklistItemDueDate({
        id: item.id,
        dueDate: null,
      });

      if (result?.serverError) {
        toast.error("Erro ao remover lembrete.");
      } else {
        toast.success("Lembrete removido.");
        setSelectedDate(undefined);
        setIsOpen(false);
        onUpdate?.();
      }
    });
  };

  const isOverdue = item.dueDate && isPast(new Date(item.dueDate)) && !item.isChecked;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 transition-colors ${
            item.dueDate 
              ? isOverdue ? "text-destructive animate-pulse" : "text-primary" 
              : "text-muted-foreground hover:text-primary"
          }`}
        >
          <Bell className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 rounded-xl border-none p-4 shadow-2xl" align="end">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <span className="text-xs font-black uppercase italic tracking-tighter">
              Definir Lembrete
            </span>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Data do Alerta
            </label>
            <DatePicker
              value={selectedDate}
              onChange={setSelectedDate}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Horário
            </label>
            <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <input
                type="time"
                className="flex-1 bg-transparent text-xs outline-none"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            {item.dueDate && (
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-[10px] font-bold uppercase text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
                disabled={isPending}
              >
                Remover
              </Button>
            )}
            <Button
              size="sm"
              className="flex-1 text-[10px] font-bold uppercase"
              onClick={handleSave}
              disabled={isPending || !selectedDate}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : "Salvar"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
