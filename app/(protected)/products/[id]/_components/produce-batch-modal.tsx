"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/_components/ui/table";
import { Badge } from "@/app/_components/ui/badge";
import { FactoryIcon, Loader2Icon, AlertTriangleIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { produceProduct } from "@/app/_actions/product/produce";
import { toast } from "sonner";
import { RecipeIngredientDto } from "@/app/_data-access/product/get-product-by-id";

const formatCurrency = (value: number) =>
  Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface ProduceBatchModalProps {
  productId: string;
  productName: string;
  productStock: number;
  recipeCost: number;
  recipes: RecipeIngredientDto[];
}

export default function ProduceBatchModal({
  productId,
  productName,
  productStock,
  recipeCost,
  recipes,
}: ProduceBatchModalProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState("");

  const qty = Number(quantity) || 0;

  const preview = useMemo(() => {
    if (qty <= 0) return null;

    const estimatedCost = recipeCost * qty;
    const stockAfter = productStock + qty;

    const ingredients = recipes.map((recipe) => {
      const totalRequired = recipe.consumptionPerUnit * qty;
      const remaining = recipe.ingredientStock - totalRequired;
      const insufficient = remaining < 0;

      return {
        name: recipe.ingredientName,
        currentStock: recipe.ingredientStock,
        required: totalRequired,
        remaining,
        unit: recipe.ingredientUnitLabel,
        insufficient,
      };
    });

    const hasInsufficientStock = ingredients.some((i) => i.insufficient);

    return { estimatedCost, stockAfter, ingredients, hasInsufficientStock };
  }, [qty, recipeCost, productStock, recipes]);

  const { execute, isPending } = useAction(produceProduct, {
    onSuccess: ({ data }) => {
      toast.success(
        `Produção de ${data?.quantity} unidades concluída! Custo total: ${formatCurrency(data?.totalCost ?? 0)}`,
      );
      setOpen(false);
      setQuantity("");
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "Erro ao produzir lote.");
    },
  });

  const handleProduce = () => {
    if (qty <= 0) return;
    execute({ productId, quantity: qty });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setQuantity(""); }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <FactoryIcon size={16} />
          Produzir Lote
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FactoryIcon size={18} />
            Produzir Lote
          </DialogTitle>
          <DialogDescription>
            Produzir unidades de <strong>{productName}</strong>.
            Os insumos serão deduzidos automaticamente conforme a receita.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="produce-qty">Quantidade a produzir</Label>
            <Input
              id="produce-qty"
              type="number"
              min="1"
              step="1"
              placeholder="Ex: 50"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          {/* Dynamic Preview */}
          {preview && (
            <div className="space-y-4 rounded-lg border p-4">
              {/* Product Stock Preview */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estoque atual</span>
                <span className="font-medium">{productStock} un</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Estoque após produção</span>
                <span className="font-bold text-green-600">
                  {preview.stockAfter} un
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Custo estimado</span>
                <span className="font-bold">{formatCurrency(preview.estimatedCost)}</span>
              </div>

              {/* Insufficient Stock Warning */}
              {preview.hasInsufficientStock && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-destructive text-sm">
                  <AlertTriangleIcon size={16} />
                  Estoque insuficiente de insumos para esta quantidade.
                </div>
              )}

              {/* Ingredient Consumption Table */}
              <div>
                <p className="mb-2 text-sm font-medium">Consumo de insumos</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead className="text-right">Atual</TableHead>
                      <TableHead className="text-right">Consumo</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.ingredients.map((ing) => (
                      <TableRow key={ing.name}>
                        <TableCell className="font-medium text-sm">{ing.name}</TableCell>
                        <TableCell className="text-right text-sm">
                          {ing.currentStock.toFixed(2)} {ing.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          -{ing.required.toFixed(2)} {ing.unit}
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          {ing.insufficient ? (
                            <Badge variant="destructive">
                              {ing.remaining.toFixed(2)} {ing.unit}
                            </Badge>
                          ) : (
                            <span className="text-green-600">
                              {ing.remaining.toFixed(2)} {ing.unit}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleProduce}
            disabled={isPending || qty <= 0 || preview?.hasInsufficientStock}
            className="gap-2"
          >
            {isPending && <Loader2Icon size={14} className="animate-spin" />}
            Confirmar Produção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
