"use client";

import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Trash2Icon,
  Settings2Icon,
  SaveIcon,
  XIcon,
  Loader2Icon,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { deleteCategory } from "@/app/_actions/product/delete-category";
import { upsertCategory } from "@/app/_actions/product/upsert-category";
import { useState } from "react";
import { toast } from "sonner";
import { Combobox } from "@/app/_components/ui/combobox";
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

interface CategoryManagementDialogProps {
  categories: ProductCategoryOption[];
}

export const CategoryManagementDialog = ({
  categories,
}: CategoryManagementDialogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [migrationData, setMigrationData] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [migrationDestinationId, setMigrationDestinationId] = useState("");

  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  const { execute: executeUpsert, isPending: isUpdating } = useAction(
    upsertCategory,
    {
      onSuccess: () => {
        toast.success("Categoria atualizada.");
        setEditingId(null);
      },
      onError: () => toast.error("Erro ao atualizar categoria."),
    },
  );

  const { execute: executeDelete, isPending: isDeleting } = useAction(
    deleteCategory,
    {
      onSuccess: () => {
        toast.success("Categoria removida.");
        setMigrationData(null);
        setMigrationDestinationId("");
        setDeleteConfirmationId(null);
      },
      onError: ({ error }) => {
        if (error.serverError === "MIGRATION_REQUIRED") {
          const cat = categories.find((c) => c.id === deleteConfirmationId || migrationData?.id === c.id);
          if (cat) setMigrationData({ id: cat.id, name: cat.name });
          setDeleteConfirmationId(null); // Close the confirm modal to show migration
        } else {
          toast.error("Erro ao remover categoria.");
          setDeleteConfirmationId(null);
        }
      },
    },
  );

  const handleDelete = (id: string, destinationId?: string) => {
    if (!destinationId && !deleteConfirmationId) {
      setDeleteConfirmationId(id);
      return;
    }
    executeDelete({ id, destinationId });
  };

  const handleUpdate = (id: string) => {
    if (!editName.trim()) return;
    executeUpsert({ id, name: editName });
  };

  const startEdit = (cat: ProductCategoryOption) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="h-11 gap-2 bg-background shadow-sm border-none"
        >
          <Settings2Icon className="w-4 h-4 text-muted-foreground" />
          <span className="text-foreground hidden md:inline">Gerenciar Categorias</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {migrationData ? (
              <div className="flex items-center gap-2">
                <Button 
                   variant="ghost" 
                   size="icon" 
                   className="h-6 w-6" 
                   onClick={() => setMigrationData(null)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                Migração de Itens
              </div>
            ) : (
              "Gerenciar Categorias"
            )}
          </DialogTitle>
        </DialogHeader>
        
        {migrationData ? (
          <div className="space-y-6 py-4">
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-bold leading-tight text-orange-500">
                    A categoria "{migrationData.name}" possui produtos vinculados.
                  </p>
                  <p className="text-xs text-orange-600">
                    Para excluir, você deve mover esses produtos para uma nova categoria.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-muted-foreground">
                Mover produtos para:
              </label>
              <Combobox
                options={categories
                  .filter((cat) => cat.id !== migrationData.id)
                  .map((cat) => ({ value: cat.id, label: cat.name }))}
                value={migrationDestinationId}
                onChange={setMigrationDestinationId}
                placeholder="Selecione uma categoria..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setMigrationData(null)}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-1.5"
                disabled={!migrationDestinationId || isDeleting}
                onClick={() => handleDelete(migrationData.id, migrationDestinationId)}
              >
                {isDeleting && <Loader2Icon className="h-4 w-4 animate-spin" />}
                {isDeleting ? "Processando..." : "Migrar e Excluir"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {categories.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              Nenhuma categoria encontrada.
            </p>
          ) : (
            categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2 rounded-lg bg-muted border border-border group"
              >
                {editingId === cat.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 bg-background"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleUpdate(cat.id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        <SaveIcon className="w-4 h-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                      disabled={isUpdating}
                    >
                      <XIcon className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium text-foreground px-2 truncate">
                      {cat.name}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEdit(cat)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Settings2Icon className="w-4 h-4 text-muted-foreground" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(cat.id)}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="w-4 h-4 text-destructive" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        )}
      </DialogContent>

      <AlertDialog open={!!deleteConfirmationId} onOpenChange={(open) => !open && setDeleteConfirmationId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente a 
              categoria <strong>"{categories.find(c => c.id === deleteConfirmationId)?.name}"</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmationId && handleDelete(deleteConfirmationId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};
