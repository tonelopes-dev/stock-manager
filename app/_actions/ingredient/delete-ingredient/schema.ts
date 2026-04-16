import { z } from "zod";

export const deleteIngredientSchema = z.object({
  id: z.string().uuid(),
});

export type DeleteIngredientSchema = z.infer<typeof deleteIngredientSchema>;
