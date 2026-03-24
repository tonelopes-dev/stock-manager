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
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { deleteCategory } from "@/app/_actions/product/delete-category";
import { upsertCategory } from "@/app/_actions/product/upsert-category";
import { useState } from "react";
import { toast } from "sonner";

interface CategoryManagementDialogProps {
  categories: ProductCategoryOption[];
}

export const CategoryManagementDialog = ({
  categories,
}: CategoryManagementDialogProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

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
      onSuccess: () => toast.success("Categoria removida."),
      onError: () => toast.error("Erro ao remover categoria."),
    },
  );

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
          <DialogTitle>Gerenciar Categorias</DialogTitle>
        </DialogHeader>
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
                    <span className="flex-1 font-medium text-foreground px-2">
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
                      onClick={() => {
                        if (confirm(`Excluir a categoria "${cat.name}"?`)) {
                          executeDelete({ id: cat.id });
                        }
                      }}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <Loader2Icon className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2Icon className="w-4 h-4 text-destructive/10" />
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
