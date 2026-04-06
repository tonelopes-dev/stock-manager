import { z } from "zod";
import { PaymentMethod } from "@prisma/client";

export const upsertSaleSchema = z.object({
  id: z.string().uuid().optional(),
  date: z.date().optional(),
  customerId: z.string().cuid().nullable().optional(),
  paymentMethod: z.nativeEnum(PaymentMethod).optional(),
  tipAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  extraAmount: z.number().min(0).default(0),
  adjustmentReason: z.string().optional().nullable(),
  isEmployeeSale: z.boolean().default(false),
  products: z.array(
    z.object({
      id: z.string().uuid(),
      quantity: z.number().positive(),
    }),
  ),
});

export type UpsertSaleSchema = z.infer<typeof upsertSaleSchema>;