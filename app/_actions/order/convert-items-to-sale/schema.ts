import { z } from "zod";

export const convertItemsToSaleSchema = z.object({
  itemIds: z.array(z.string()),
  companyId: z.string(),
  paymentMethod: z.enum(["CASH", "CREDIT_CARD", "DEBIT_CARD", "PIX", "OTHER"]).nullable().optional(),
  tipAmount: z.number().min(0).default(0),
  discountAmount: z.number().min(0).default(0),
  extraAmount: z.number().min(0).default(0),
  adjustmentReason: z.string().optional().nullable(),
  isEmployeeSale: z.boolean().default(false),
  status: z.enum(["ACTIVE", "DRAFT", "PENDING_PAYMENT"]).optional().default("ACTIVE"),
  dueDate: z.date().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

export type ConvertItemsToSaleSchema = z.infer<typeof convertItemsToSaleSchema>;
