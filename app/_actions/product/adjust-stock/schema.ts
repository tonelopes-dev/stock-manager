import { z } from "zod";

export const adjustStockSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: "A quantidade deve ser diferente de zero.",
  }),
  reason: z.string().trim().min(3, {
    message: "O motivo deve ter pelo menos 3 caracteres.",
  }),
});

export type AdjustStockSchema = z.infer<typeof adjustStockSchema>;
