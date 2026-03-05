import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const upsertSaleSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.date().optional(),
  customerId: z.string().cuid().nullable().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  products: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export type UpsertSaleSchema = z.infer<typeof upsertSaleSchema>;