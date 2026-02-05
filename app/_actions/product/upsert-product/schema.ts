import { z } from "zod";

export const upsertProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, {
    message: "O nome do produto é obrigatório.",
  }),
  price: z.number().min(0.01, {
    message: "O preço do produto é obrigatório.",
  }),
  cost: z.number().min(0, {
    message: "O custo do produto deve ser positivo.",
  }),
  sku: z.string().trim().nullable().optional(),
  category: z.string().trim().nullable().optional(),
  stock: z.coerce.number().int().min(0, {
    message: "A quantidade em estoque é obrigatória.",
  }),
  minStock: z.coerce.number().int().min(0).default(0),
}).refine((data) => data.cost <= data.price, {
  message: "O custo não pode ser maior que o preço de venda.",
  path: ["cost"],
});

export type UpsertProductSchema = z.infer<typeof upsertProductSchema>;