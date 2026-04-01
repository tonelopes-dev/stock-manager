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
import {
  Settings2,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
} from "lucide-react";
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
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect } from "react";

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

  const [localStages, setLocalStages] = useState(stages);

  useEffect(() => {
    setLocalStages(stages);
  }, [stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

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

  const handleUpdateStage = (id: string, name: string) => {
    if (!name) return;
    startTransition(async () => {
      const result = await upsertCRMStage({ id, name });
      if (result?.validationErrors || result?.serverError) {
        toast.error("Erro ao atualizar estágio.");
      } else {
        toast.success("Estágio atualizado!");
        setEditingId(null);
      }
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = localStages.findIndex((s) => s.id === active.id);
      const newIndex = localStages.findIndex((s) => s.id === over.id);

      const newOrder = arrayMove(localStages, oldIndex, newIndex);
      setLocalStages(newOrder);

      startTransition(async () => {
        try {
          const result = await reorderCRMStages({
            stageIds: newOrder.map((s) => s.id),
          });
          if (result?.validationErrors || result?.serverError) {
            toast.error("Erro ao reordenar estágios.");
            setLocalStages(stages); // Rollback
          }
        } catch (error) {
          toast.error("Erro ao reordenar estágios.");
          setLocalStages(stages); // Rollback
        }
      });
    }
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
        <Button variant="outline" className="gap-2 border-primary text-primary hover:bg-primary/10">
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
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                <div className="space-y-1">
                  <p className="text-sm font-bold leading-tight text-orange-500">
                    O item "{migrationData.name}" possui clientes vinculados.
                  </p>
                  <p className="text-xs text-orange-600">
                    Para excluir, você deve mover esses clientes para um novo
                    destino.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">
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
                className="flex-1 gap-1.5"
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
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
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
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="max-h-[300px] space-y-2 overflow-auto pr-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="group flex items-center justify-between rounded-md border border-border p-2 hover:bg-muted"
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
                          disabled={isPending}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "OK"
                          )}
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
                            className="h-7 w-7 text-destructive"
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
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
              <div className="max-h-[300px] overflow-auto pr-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={localStages.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {localStages.map((stage) => (
                        <SortableStageItem
                          key={stage.id}
                          stage={stage}
                          isEditing={editingId === stage.id}
                          editingName={editingName}
                          onEditClick={() => {
                            setEditingId(stage.id);
                            setEditingName(stage.name);
                          }}
                          onCancelEdit={() => setEditingId(null)}
                          onSaveEdit={(name) => handleUpdateStage(stage.id, name)}
                          onDeleteClick={() => handleDeleteStage(stage.id)}
                          isPending={isPending}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
              <p className="text-center text-[10px] font-bold uppercase italic text-muted-foreground">
                A ordem aqui define as colunas do seu Kanban
              </p>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface SortableStageItemProps {
  stage: { id: string; name: string };
  isEditing: boolean;
  editingName: string;
  onEditClick: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (name: string) => void;
  onDeleteClick: () => void;
  isPending: boolean;
}

const SortableStageItem = ({
  stage,
  isEditing,
  editingName,
  onEditClick,
  onCancelEdit,
  onSaveEdit,
  onDeleteClick,
  isPending,
}: SortableStageItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  const [localName, setLocalName] = useState(editingName);

  useEffect(() => {
    if (isEditing) setLocalName(editingName);
  }, [isEditing, editingName]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center justify-between rounded-md border border-border p-2 hover:bg-muted ${isDragging ? "bg-muted shadow-sm" : "bg-background"}`}
    >
      {isEditing ? (
        <div className="flex w-full gap-2">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit(localName);
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => onSaveEdit(localName)}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "OK"
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit}>
            X
          </Button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners}>
              <GripVertical className="h-4 w-4 cursor-grab text-muted-foreground active:cursor-grabbing" />
            </div>
            <span className="text-sm font-medium">{stage.name}</span>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={onEditClick}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-destructive"
              onClick={onDeleteClick}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
