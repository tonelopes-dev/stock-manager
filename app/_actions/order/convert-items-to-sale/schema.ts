import { z } from "zod";

export const convertItemsToSaleSchema = z.object({
  itemIds: z.array(z.string()),
  companyId: z.string(),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "OTHER"]),
  tipAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  discountReason: z.string().optional().nullable(),
  isEmployeeSale: z.boolean().default(false),
});

export type ConvertItemsToSaleSchema = z.infer<typeof convertItemsToSaleSchema>;
