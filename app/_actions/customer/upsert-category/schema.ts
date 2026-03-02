import { z } from "zod";

export const upsertCustomerCategorySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "O nome é obrigatório"),
});

export type UpsertCustomerCategorySchema = z.infer<typeof upsertCustomerCategorySchema>;
