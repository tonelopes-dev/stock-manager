import { z } from "zod";

export const createStockEntrySchema = z.object({
  productId: z.string().uuid("Produto inválido"),
  supplierId: z.string().cuid("Fornecedor inválido").optional().or(z.literal("")),
  quantity: z.number().positive("A quantidade deve ser maior que zero"),
  unitCost: z.number().nonnegative("O custo unitário não pode ser negativo"),
  batchNumber: z.string().optional(),
  expirationDate: z.date().optional(),
  invoiceNumber: z.string().optional(),
  description: z.string().optional(),
});

export type CreateStockEntrySchema = z.infer<typeof createStockEntrySchema>;
