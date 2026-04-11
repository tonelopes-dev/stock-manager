"use client";

import { useState, useEffect } from "react";
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

import { UNIT_CONFIG } from "@/app/_lib/units-shared";
import { UnitType } from "@prisma/client";

const UNIT_OPTIONS = [
  { value: "KG", label: "Kg", family: "MASS" },
  { value: "G", label: "g", family: "MASS" },
  { value: "L", label: "L", family: "VOLUME" },
  { value: "ML", label: "ml", family: "VOLUME" },
  { value: "UN", label: "Un", family: "UNIT" },
];

interface AddIngredientFormProps {
  productId: string;
  ingredientOptions: ComboboxOption[];
}

export default function AddIngredientForm({
  productId,
  ingredientOptions = [],
}: AddIngredientFormProps) {
  const [ingredientId, setIngredientId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedIngredient = (ingredientOptions || []).find(
    (opt) => opt.value === ingredientId,
  );
  const selectedFamily = selectedIngredient?.unit
    ? UNIT_CONFIG[selectedIngredient.unit as UnitType]?.family
    : null;

  const filteredUnitOptions = selectedFamily
    ? UNIT_OPTIONS.filter((opt) => opt.family === selectedFamily)
    : UNIT_OPTIONS;

  const handleIngredientChange = (id: string) => {
    setIngredientId(id);
    setQuantity(""); // Clear quantity when ingredient changes
    const ingredient = (ingredientOptions || []).find((opt) => opt.value === id);
    if (ingredient?.unit) {
      setUnit(ingredient.unit);
    } else {
      setUnit("");
    }
  };

  const { execute, isPending } = useAction(addRecipeIngredient, {
    onSuccess: () => {
      toast.success("Item adicionado com sucesso.");
      setIngredientId("");
      setQuantity("");
      setUnit("");
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Erro ao adicionar insumo.");
    },
  });

  if (!isMounted) {
    return <div className="h-20 flex items-center justify-center border-t mt-4 text-xs text-muted-foreground animate-pulse">Carregando formulário...</div>;
  }

  const handleSubmit = () => {
    if (!ingredientId || !quantity || !unit) {
      toast.error("Preencha todos os campos.");
      return;
    }

    // Validation for integer units
    if (unit === "UN" && !Number.isInteger(Number(quantity))) {
      toast.error("Quantidade deve ser um número inteiro para a unidade 'Un'.");
      return;
    }

    execute({
      productId,
      ingredientId,
      quantity: Number(quantity),
      unit: unit as "KG" | "G" | "L" | "ML" | "UN",
    });
  };

  const selectedUnitConfig = unit ? UNIT_CONFIG[unit as UnitType] : null;

  return (
    <div data-ready={isMounted} data-testid="add-recipe-ingredient-form" className="flex items-end gap-3 border-t pt-4">
      <div className="flex-1 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Item / Componente
        </label>
        <Combobox
          value={ingredientId}
          onChange={handleIngredientChange}
          options={ingredientOptions}
          placeholder="Selecionar item..."
          data-testid="ingredient-selector"
        />
      </div>

      <div className="w-28 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Quantidade
        </label>
        <Input
          type="number"
          step={selectedUnitConfig?.step || "0.01"}
          min={selectedUnitConfig?.min || "0.01"}
          placeholder={selectedUnitConfig?.placeholder || "Ex: 150"}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-label="Quantidade"
        />
      </div>

      <div className="w-24 space-y-1">
        <label className="text-xs font-medium text-muted-foreground">
          Unidade
        </label>
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger aria-label="Unidade de Medida">
            <SelectValue placeholder="Un." />
          </SelectTrigger>
          <SelectContent>
            {filteredUnitOptions.map((opt) => (
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
        aria-label="Adicionar"
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
