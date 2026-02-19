"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { RecipeIngredientDto } from "@/app/_data-access/product/get-product-by-id";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { BeakerIcon, EditIcon, TrashIcon, CheckIcon, XIcon, Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { updateRecipeIngredient } from "@/app/_actions/product/recipe/update-ingredient";
import { deleteRecipeIngredient } from "@/app/_actions/product/recipe/delete-ingredient";
import { toast } from "sonner";

const UNIT_OPTIONS = [
  { value: "KG", label: "Kg" },
  { value: "G", label: "g" },
  { value: "L", label: "L" },
  { value: "ML", label: "ml" },
  { value: "UN", label: "Un" },
];

interface RecipeTableProps {
  recipes: RecipeIngredientDto[];
  recipeCost: number;
}

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export default function RecipeTable({ recipes, recipeCost }: RecipeTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnit, setEditUnit] = useState("");

  const { execute: executeUpdate, isPending: isUpdating } = useAction(updateRecipeIngredient, {
    onSuccess: () => {
      toast.success("Insumo atualizado.");
      setEditingId(null);
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "Erro ao atualizar insumo.");
    },
  });

  const { execute: executeDelete, isPending: isDeleting } = useAction(deleteRecipeIngredient, {
    onSuccess: () => {
      toast.success("Insumo removido da receita.");
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "Erro ao remover insumo.");
    },
  });

  const startEditing = (recipe: RecipeIngredientDto) => {
    setEditingId(recipe.id);
    setEditQuantity(recipe.quantity.toString());
    setEditUnit(recipe.unit);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditQuantity("");
    setEditUnit("");
  };

  const saveEdit = (id: string) => {
    executeUpdate({
      id,
      quantity: Number(editQuantity),
      unit: editUnit as "KG" | "G" | "L" | "ML" | "UN",
    });
  };

  if (recipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
        <BeakerIcon size={40} strokeWidth={1.5} />
        <p className="text-sm font-medium">Nenhum insumo cadastrado na receita</p>
        <p className="text-xs">Adicione ingredientes abaixo para compor a receita deste produto.</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Insumo</TableHead>
          <TableHead className="text-right">Quantidade</TableHead>
          <TableHead>Unidade</TableHead>
          <TableHead className="text-right">Custo Unit.</TableHead>
          <TableHead className="text-right">Custo Parcial</TableHead>
          <TableHead className="w-[100px]">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipes.map((recipe) => {
          const isEditing = editingId === recipe.id;

          return (
            <TableRow key={recipe.id}>
              <TableCell className="font-medium">{recipe.ingredientName}</TableCell>
              <TableCell className="text-right">
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="w-20 ml-auto h-8 text-right"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value)}
                  />
                ) : (
                  recipe.quantity
                )}
              </TableCell>
              <TableCell>
                {isEditing ? (
                  <Select value={editUnit} onValueChange={setEditUnit}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  recipe.unitLabel
                )}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(recipe.ingredientCost)}/{recipe.ingredientUnitLabel}
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(recipe.partialCost)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  {isEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => saveEdit(recipe.id)}
                        disabled={isUpdating}
                      >
                        {isUpdating ? (
                          <Loader2Icon size={14} className="animate-spin" />
                        ) : (
                          <CheckIcon size={14} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={cancelEditing}
                      >
                        <XIcon size={14} />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => startEditing(recipe)}
                      >
                        <EditIcon size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <TrashIcon size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remover insumo</AlertDialogTitle>
                            <AlertDialogDescription>
                              Deseja remover <strong>{recipe.ingredientName}</strong> da receita?
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => executeDelete({ id: recipe.id })}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2Icon size={14} className="animate-spin mr-2" />
                              ) : null}
                              Remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={4} className="font-bold">
            Custo Total da Receita
          </TableCell>
          <TableCell className="text-right font-bold">
            {formatCurrency(recipeCost)}
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
