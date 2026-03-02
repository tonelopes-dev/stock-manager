"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Settings2, Plus, Pencil, Trash2, GripVertical } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/app/_components/ui/tabs";
import { Input } from "@/app/_components/ui/input";
import { toast } from "sonner";
import { upsertCustomerCategory } from "@/app/_actions/customer/upsert-category";
import { deleteCustomerCategory } from "@/app/_actions/customer/delete-category";
import { upsertCRMStage } from "@/app/_actions/crm/upsert-stage";
import { deleteCRMStage } from "@/app/_actions/crm/delete-stage";
import { reorderCRMStages } from "@/app/_actions/crm/reorder-stages";
import { Combobox } from "@/app/_components/ui/combobox";
import { AlertTriangle } from "lucide-react";

interface CRMConfigModalProps {
  categories: { id: string; name: string }[];
  stages: { id: string; name: string; order: number }[];
}

export const CRMConfigModal = ({ categories, stages }: CRMConfigModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [newCategory, setNewCategory] = useState("");
  const [newStage, setNewStage] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Migration State
  const [migrationData, setMigrationData] = useState<{
    id: string;
    type: "category" | "stage";
    name: string;
  } | null>(null);
  const [migrationDestinationId, setMigrationDestinationId] = useState("");

  const handleAddCategory = () => {
    if (!newCategory) return;
    startTransition(async () => {
      const result = await upsertCustomerCategory({ name: newCategory });
      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao adicionar categoria.");
      } else {
        toast.success("Categoria adicionada!");
        setNewCategory("");
      }
    });
  };

  const handleUpdateCategory = (id: string) => {
    startTransition(async () => {
      const result = await upsertCustomerCategory({ id, name: editingName });
      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao atualizar categoria.");
      } else {
        toast.success("Categoria atualizada!");
        setEditingId(null);
      }
    });
  };

  const handleDeleteCategory = (id: string, destinationId?: string) => {
    if (
      !destinationId &&
      !confirm("Tem certeza que deseja excluir esta categoria?")
    )
      return;

    startTransition(async () => {
      try {
        const result = await deleteCustomerCategory({ id, destinationId });
        if (result?.serverError === "MIGRATION_REQUIRED") {
          const cat = categories.find((c) => c.id === id);
          setMigrationData({ id, type: "category", name: cat?.name || "" });
          return;
        }

        if (result?.validationErrors || result?.serverError) {
          toast.error(result.serverError || "Erro ao excluir categoria.");
        } else {
          toast.success("Categoria excluída!");
          setMigrationData(null);
          setMigrationDestinationId("");
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir categoria.");
      }
    });
  };

  // Stage Handlers
  const handleAddStage = () => {
    if (!newStage) return;
    startTransition(async () => {
      const result = await upsertCRMStage({ name: newStage });
      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao adicionar estágio.");
      } else {
        toast.success("Estágio adicionado!");
        setNewStage("");
      }
    });
  };

  const handleDeleteStage = (id: string, destinationId?: string) => {
    if (
      !destinationId &&
      !confirm("Tem certeza que deseja excluir este estágio?")
    )
      return;

    startTransition(async () => {
      try {
        const result = await deleteCRMStage({ id, destinationId });
        if (result?.serverError === "MIGRATION_REQUIRED") {
          const stage = stages.find((s) => s.id === id);
          setMigrationData({ id, type: "stage", name: stage?.name || "" });
          return;
        }

        if (result?.validationErrors || result?.serverError) {
          toast.error(result.serverError || "Erro ao excluir estágio.");
        } else {
          toast.success("Estágio excluído!");
          setMigrationData(null);
          setMigrationDestinationId("");
        }
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir estágio.");
      }
    });
  };

  const migrationOptions =
    migrationData?.type === "category"
      ? categories
          .filter((c) => c.id !== migrationData.id)
          .map((c) => ({ value: c.id, label: c.name }))
      : stages
          .filter((s) => s.id !== migrationData?.id)
          .map((s) => ({ value: s.id, label: s.name }));

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setMigrationData(null);
          setMigrationDestinationId("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-slate-200">
          <Settings2 className="h-4 w-4" />
          Configurar CRM
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {migrationData ? "Migração Necessária" : "Configurações do CRM"}
          </DialogTitle>
        </DialogHeader>

        {migrationData ? (
          <div className="space-y-6 pt-4">
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <div className="space-y-1">
                  <p className="text-sm font-bold leading-tight text-amber-900">
                    O item "{migrationData.name}" possui clientes vinculados.
                  </p>
                  <p className="text-xs text-amber-700">
                    Para excluir, você deve mover esses clientes para um novo
                    destino.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400">
                Mover clientes para:
              </label>
              <Combobox
                options={migrationOptions}
                value={migrationDestinationId}
                onChange={setMigrationDestinationId}
                placeholder={`Selecione um ${migrationData.type === "category" ? "uma categoria" : "um estágio"}...`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMigrationData(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                disabled={!migrationDestinationId || isPending}
                onClick={() => {
                  if (migrationData.type === "category") {
                    handleDeleteCategory(
                      migrationData.id,
                      migrationDestinationId,
                    );
                  } else {
                    handleDeleteStage(migrationData.id, migrationDestinationId);
                  }
                }}
              >
                {isPending ? "Processando..." : "Migrar e Excluir"}
              </Button>
            </div>
          </div>
        ) : (
          <Tabs defaultValue="categories" className="mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="categories">Categorias</TabsTrigger>
              <TabsTrigger value="stages">Estágios (Board)</TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nova categoria..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
                />
                <Button
                  size="icon"
                  onClick={handleAddCategory}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto pr-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="group flex items-center justify-between rounded-md border border-slate-100 p-2 hover:bg-slate-50"
                  >
                    {editingId === category.id ? (
                      <div className="flex w-full gap-2">
                        <Input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleUpdateCategory(category.id)}
                        >
                          OK
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                        >
                          X
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(category.id);
                              setEditingName(category.name);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-500"
                            onClick={() => handleDeleteCategory(category.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stages" className="space-y-4 pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Novo estágio..."
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                />
                <Button
                  size="icon"
                  onClick={handleAddStage}
                  disabled={isPending}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto pr-2">
                {stages.map((stage) => (
                  <div
                    key={stage.id}
                    className="group flex items-center justify-between rounded-md border border-slate-100 p-2 hover:bg-slate-50"
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-4 w-4 cursor-grab text-slate-300 active:cursor-grabbing" />
                      <span className="text-sm font-medium">{stage.name}</span>
                    </div>
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-red-500"
                        onClick={() => handleDeleteStage(stage.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-[10px] font-bold uppercase italic text-slate-400">
                A ordem aqui define as colunas do seu Kanban
              </p>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
