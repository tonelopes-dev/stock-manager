import { z } from "zod";

export const upsertIngredientSchema = z.object({
  id: z.string().cuid("ID de insumo inválido").optional().or(z.literal("")),
  name: z.string().trim().min(1, {
    message: "O nome do insumo é obrigatório.",
  }),
  unit: z.enum(["KG", "G", "L", "ML", "UN"], {
    required_error: "A unidade de medida é obrigatória.",
  }),
  cost: z.number().min(0, {
    message: "O custo unitário não pode ser negativo.",
  }),
  stock: z.coerce
    .number()
    .min(0, {
      message: "O estoque inicial não pode ser negativo.",
    })
    .default(0)
    .optional(),
  minStock: z.coerce
    .number()
    .min(0, {
      message: "O estoque mínimo não pode ser negativo.",
    })
    .default(0),
  sku: z
    .string()
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  description: z
    .string()
    .optional()
    .transform((val) => (val?.trim() === "" ? undefined : val)),
  expirationDate: z.coerce.date().nullable().optional(),
  trackExpiration: z.boolean().default(false),
  expirationReminderDate: z.coerce.date().nullable().optional(),
});

export type UpsertIngredientSchema = z.infer<typeof upsertIngredientSchema>;
