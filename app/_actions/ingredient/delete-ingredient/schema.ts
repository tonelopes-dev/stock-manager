import { z } from "zod";

export const deleteIngredientSchema = z.object({
  id: z.string().cuid(),
});

export type DeleteIngredientSchema = z.infer<typeof deleteIngredientSchema>;
