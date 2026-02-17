"use client";

import { useState } from "react";
import { useAction } from "next-safe-action/hooks";
import { addRecipeIngredient } from "@/app/_actions/product/recipe/add-ingredient";
import { Combobox, ComboboxOption } from "@/app/_components/ui/combobox";
import { Button } from "@/app/_components/ui/button";
import { Input } from "@/app/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Loader2Icon, PlusIcon } from "lucide-react";
import { toast } from "sonner";

const UNIT_OPTIONS = [
  { value: "KG", label: "Kg" },
  { value: "G", label: "g" },
  { value: "L", label: "L" },
  { value: "ML", label: "ml" },
  { value: "UN", label: "Un" },
];

interface AddIngredientFormProps {
  productId: string;
  ingredientOptions: ComboboxOption[];
}

export default function AddIngredientForm({
  productId,
  ingredientOptions,
}: AddIngredientFormProps) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");

  const { execute, isPending } = useAction(addRecipeIngredient, {
    onSuccess: () => {
      toast.success("Insumo adicionado à receita.");
      setIngredientId("");
      setQuantity("");
      setUnit("");
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Erro ao adicionar insumo.");
    },
  });

  const handleSubmit = () => {
    if (!ingredientId || !quantity || !unit) {
      toast.error("Preencha todos os campos.");
      return;
    }

    execute({
      productId,
      ingredientId,
      quantity: Number(quantity),
      unit: unit as "KG" | "G" | "L" | "ML" | "UN",
    });
  };

  return (
    <div className="flex items-end gap-3 pt-4 border-t">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Insumo</label>
        <Combobox
          value={ingredientId}
          onChange={setIngredientId}
          options={ingredientOptions}
          placeholder="Selecionar insumo..."
        />
      </div>

      <div className="w-28 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Quantidade</label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="Ex: 150"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>

      <div className="w-24 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Unidade</label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger>
            <SelectValue placeholder="Un." />
          </SelectTrigger>
          <SelectContent>
            {UNIT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isPending}
        size="icon"
        className="shrink-0"
      >
        {isPending ? (
          <Loader2Icon className="animate-spin" size={16} />
        ) : (
          <PlusIcon size={16} />
        )}
      </Button>
    </div>
  );
}
