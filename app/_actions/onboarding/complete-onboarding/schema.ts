import { z } from "zod";

export const completeOnboardingSchema = z.object({
  companyName: z.string().min(2, "O nome da empresa deve ter pelo menos 2 caracteres"),
  productName: z.string().min(2, "O nome do produto deve ter pelo menos 2 caracteres"),
  productPrice: z.number().positive("O preço deve ser positivo"),
  productStock: z.number().int().min(0, "O estoque não pode ser negativo"),
});

export type CompleteOnboardingSchema = z.infer<typeof completeOnboardingSchema>;
