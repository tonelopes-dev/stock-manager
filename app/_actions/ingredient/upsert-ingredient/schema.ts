import { z } from "zod";

export const upsertIngredientSchema = z.object({
  id: z.string().cuid().optional(),
  name: z.string().trim().min(1, {
    message: "O nome do insumo é obrigatório.",
  }),
  unit: z.enum(["KG", "G", "L", "ML", "UN"], {
    required_error: "A unidade de medida é obrigatória.",
  }),
  cost: z.number().min(0, {
    message: "O custo deve ser maior ou igual a zero.",
  }),
  stock: z.coerce.number().min(0, {
    message: "O estoque inicial deve ser maior ou igual a zero.",
  }).default(0).optional(),
  minStock: z.coerce.number().min(0).default(0),
});

export type UpsertIngredientSchema = z.infer<typeof upsertIngredientSchema>;
