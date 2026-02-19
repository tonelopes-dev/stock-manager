import { z } from "zod";

export const adjustIngredientStockSchema = z.object({
  id: z.string().cuid(),
  quantity: z.number().refine((val) => val !== 0, {
    message: "A quantidade deve ser diferente de zero.",
  }),
  reason: z.string().trim().min(3, {
    message: "O motivo deve ter pelo menos 3 caracteres.",
  }),
});

export type AdjustIngredientStockSchema = z.infer<typeof adjustIngredientStockSchema>;
