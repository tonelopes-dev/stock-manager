"use client";

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
import { Button } from "@/app/_components/ui/button";
import { Dialog } from "@/app/_components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  EditIcon,
  PackagePlusIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import UpsertIngredientDialogContent from "./upsert-dialog-content";
import AdjustStockDialogContent from "./adjust-stock-dialog-content";
import { IngredientDto } from "@/app/_data-access/ingredient/get-ingredients";
import { deleteIngredient } from "@/app/_actions/ingredient/delete-ingredient";

interface IngredientTableDropdownMenuProps {
  ingredient: IngredientDto;
}

const IngredientTableDropdownMenu = ({
  ingredient,
}: IngredientTableDropdownMenuProps) => {
  const [editDialogOpen, setEditDialogIsOpen] = useState(false);
  const [adjustDialogOpen, setAdjustDialogIsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogIsOpen] = useState(false);

  const { execute: executeDelete } = useAction(deleteIngredient, {
    onSuccess: () => {
      toast.success("Insumo desativado com sucesso.");
      setDeleteDialogIsOpen(false);
    },
    onError: () => {
      toast.error("Ocorreu um erro ao desativar o insumo.");
    },
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost">
            <MoreHorizontalIcon size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-1.5"
            onClick={() => setEditDialogIsOpen(true)}
          >
            <EditIcon size={16} />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-1.5"
            onClick={() => setAdjustDialogIsOpen(true)}
          >
            <PackagePlusIcon size={16} />
            Ajustar Estoque
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="gap-1.5 text-destructive"
            onClick={() => setDeleteDialogIsOpen(true)}
          >
            <TrashIcon size={16} />
            Desativar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog — completely independent */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogIsOpen}>
        <UpsertIngredientDialogContent
          defaultValues={{
            id: ingredient.id,
            name: ingredient.name,
            unit: ingredient.unit,
            cost: ingredient.cost,
            stock: ingredient.stock,
            minStock: ingredient.minStock,
          }}
          setDialogIsOpen={setEditDialogIsOpen}
        />
      </Dialog>

      {/* Adjust Stock Dialog — completely independent */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogIsOpen}>
        <AdjustStockDialogContent
          ingredientId={ingredient.id}
          ingredientName={ingredient.name}
          currentStock={ingredient.stock}
          unitLabel={ingredient.unitLabel}
          setDialogIsOpen={setAdjustDialogIsOpen}
        />
      </Dialog>

      {/* Delete Confirmation — completely independent */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogIsOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desativar insumo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desativar <strong>{ingredient.name}</strong>?
              O insumo não será excluído permanentemente e poderá ser reativado no futuro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => executeDelete({ id: ingredient.id })}
            >
              Desativar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default IngredientTableDropdownMenu;
