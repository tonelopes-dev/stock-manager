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
  ExternalLinkIcon,
  RefreshCcwIcon,
} from "lucide-react";
import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import Link from "next/link";
import UpsertIngredientDialogContent from "./upsert-dialog-content";
import AdjustStockDialogContent from "@/app/_components/adjust-stock-dialog-content";
import { adjustIngredientStock } from "@/app/_actions/ingredient/adjust-ingredient-stock";
import { IngredientDto } from "@/app/_data-access/ingredient/get-ingredients";
import { deleteIngredient } from "@/app/_actions/ingredient/delete-ingredient";
import { toggleProductStatus } from "@/app/_actions/product/toggle-status";

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

  const { execute: executeToggleStatus, isPending: toggleIsPending } = useAction(toggleProductStatus, {
    onSuccess: (data) => {
      toast.success(ingredient.isActive ? "Insumo desativado com sucesso." : "Insumo reativado com sucesso.");
      setDeleteDialogIsOpen(false);
    },
    onError: () => {
      toast.error("Ocorreu um erro ao alterar o status do insumo.");
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
          <DropdownMenuItem asChild>
            <Link href={`/cardapio/${ingredient.id}`} className="gap-1.5 focus:cursor-pointer">
              <ExternalLinkIcon size={16} />
              Ver Detalhes
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-1.5"
            onSelect={(e) => {
              e.preventDefault();
              setEditDialogIsOpen(true);
            }}
          >
            <EditIcon size={16} />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="gap-1.5"
            onSelect={(e) => {
              e.preventDefault();
              setAdjustDialogIsOpen(true);
            }}
          >
            <PackagePlusIcon size={16} />
            Ajustar Estoque
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {ingredient.isActive ? (
            <DropdownMenuItem
              className="gap-1.5 text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setDeleteDialogIsOpen(true);
              }}
            >
              <TrashIcon size={16} />
              Desativar
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="gap-1.5 text-blue-600 focus:text-blue-700 focus:bg-blue-50"
              onClick={() => executeToggleStatus({ id: ingredient.id })}
              disabled={toggleIsPending}
            >
              <RefreshCcwIcon size={16} />
              Reativar
            </DropdownMenuItem>
          )}
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
            expirationDate: ingredient.expirationDate,
            trackExpiration: ingredient.trackExpiration,
          }}
          setDialogIsOpen={setEditDialogIsOpen}
        />
      </Dialog>

      {/* Adjust Stock Dialog — completely independent */}
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogIsOpen}>
        <AdjustStockDialogContent
          itemId={ingredient.id}
          itemName={ingredient.name}
          currentStock={ingredient.stock}
          baseUnit={ingredient.unit}
          setDialogIsOpen={setAdjustDialogIsOpen}
          adjustAction={adjustIngredientStock}
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
