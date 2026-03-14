import { z } from "zod";

export const upsertCategorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "O nome da categoria é obrigatório.",
  }),
});

export type UpsertCategorySchema = z.infer<typeof upsertCategorySchema>;
