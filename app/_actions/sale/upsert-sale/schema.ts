import { z } from "zod";

export const upsertSaleSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.date().optional(),
  customerId: z.string().cuid().nullable().optional(),
  products: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export type UpsertSaleSchema = z.infer<typeof upsertSaleSchema>;