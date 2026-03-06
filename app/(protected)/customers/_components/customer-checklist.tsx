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
} from "lucide-react";
import {
  toggleChecklistItem,
  applyChecklistTemplate,
  deleteChecklist,
} from "@/app/_actions/checklist";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface CustomerChecklistProps {
  customerId: string;
  checklists: (Checklist & { items: ChecklistItem[] })[];
  templates: ChecklistTemplate[];
}

export const CustomerChecklist = ({
  customerId,
  checklists,
  templates,
}: CustomerChecklistProps) => {
  const [isPending, startTransition] = useTransition();
  const [expandedChecklists, setExpandedChecklists] = useState<string[]>(
    checklists.map((c) => c.id),
  );

  const toggleExpand = (id: string) => {
    setExpandedChecklists((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleToggleItem = (itemId: string, isChecked: boolean) => {
    startTransition(async () => {
      const result = await toggleChecklistItem({ id: itemId, isChecked });
      if (result?.serverError) toast.error("Erro ao atualizar item.");
    });
  };

  const handleApplyTemplate = (templateId: string) => {
    startTransition(async () => {
      const result = await applyChecklistTemplate({ customerId, templateId });
      if (result?.serverError) {
        toast.error("Erro ao aplicar template.");
      } else {
        toast.success("Jornada aplicada com sucesso!");
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
      }
    });
  };

  return (
    <div className="space-y-6">
      {checklists.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
            <ClipboardList className="h-6 w-6 text-slate-400" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">
            Nenhuma jornada iniciada
          </h4>
          <p className="mb-6 text-xs text-slate-500">
            Comece a acompanhar o progresso deste cliente aplicando um template.
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
              <span className="text-[10px] font-bold uppercase italic text-slate-400">
                Nenhum template disponível
              </span>
            )}
          </div>
        </div>
      )}

      {checklists.map((checklist) => {
        const total = checklist.items.length;
        const checked = checklist.items.filter((i) => i.isChecked).length;
        const progress = total > 0 ? Math.round((checked / total) * 100) : 0;
        const isExpanded = expandedChecklists.includes(checklist.id);

        return (
          <div
            key={checklist.id}
            className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-slate-500"
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
                  <h4 className="text-xs font-black uppercase italic tracking-tighter text-slate-900">
                    {checklist.title}
                  </h4>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black italic text-primary">
                    {progress}%
                  </span>
                  <Progress
                    value={progress}
                    className="h-1.5 w-16 bg-slate-200"
                    indicatorClassName="bg-primary"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-red-400 hover:bg-red-50 hover:text-red-500"
                  onClick={() => handleDeleteChecklist(checklist.id)}
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
                      <p className="py-2 text-center text-[10px] italic text-slate-400">
                        Checklist vazio
                      </p>
                    )}
                    {checklist.items
                      .sort((a, b) => a.order - b.order)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                        >
                          <Checkbox
                            id={item.id}
                            checked={item.isChecked}
                            onCheckedChange={(checked) =>
                              handleToggleItem(item.id, checked as boolean)
                            }
                            className="h-4 w-4 rounded-md border-slate-300 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                          />
                          <label
                            htmlFor={item.id}
                            className={`flex-1 cursor-pointer text-sm font-medium transition-all duration-300 ${
                              item.isChecked
                                ? "text-slate-400 line-through decoration-primary/40"
                                : "text-slate-600"
                            }`}
                          >
                            {item.title}
                          </label>
                        </div>
                      ))}
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
            className="gap-2 text-[10px] font-black uppercase text-slate-400 hover:bg-primary/5 hover:text-primary"
            // This would open a template picker or just show them
          >
            <Plus className="h-3 w-3" /> Adicionar Outra Jornada
          </Button>
        </div>
      )}
    </div>
  );
};
