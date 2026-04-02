import { z } from "zod";

export const updateCompanySchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  allowNegativeStock: z.boolean().default(false),
  estimatedMonthlyVolume: z.number().int().min(1).default(1000),
  enableOverheadInjection: z.boolean().default(true),
});

export type UpdateCompanySchema = z.infer<typeof updateCompanySchema>;
