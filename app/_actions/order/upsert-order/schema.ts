import { z } from "zod";

export const upsertOrderSchema = z.object({
  companyId: z.string(),
  customerId: z.string().min(1, "Identificação do cliente é obrigatória"),
  items: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
  })),
  tableNumber: z.string().optional(),
  notes: z.string().optional(),
});

export type UpsertOrderSchema = z.infer<typeof upsertOrderSchema>;
