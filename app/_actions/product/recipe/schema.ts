import { z } from "zod";

export const addRecipeIngredientSchema = z.object({
  productId: z.string().uuid(),
  ingredientId: z.string().min(1, { message: "Selecione um insumo." }),
  quantity: z.number().positive({ message: "A quantidade deve ser maior que zero." }),
  unit: z.enum(["KG", "G", "L", "ML", "UN"], { message: "Selecione uma unidade." }),
});

export type AddRecipeIngredientSchema = z.infer<typeof addRecipeIngredientSchema>;

export const updateRecipeIngredientSchema = z.object({
  id: z.string().min(1),
  quantity: z.number().positive({ message: "A quantidade deve ser maior que zero." }),
  unit: z.enum(["KG", "G", "L", "ML", "UN"], { message: "Selecione uma unidade." }),
});

export type UpdateRecipeIngredientSchema = z.infer<typeof updateRecipeIngredientSchema>;

export const deleteRecipeIngredientSchema = z.object({
  id: z.string().min(1),
});

export type DeleteRecipeIngredientSchema = z.infer<typeof deleteRecipeIngredientSchema>;

