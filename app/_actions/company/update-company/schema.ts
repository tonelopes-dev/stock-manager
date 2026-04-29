import { z } from "zod";

export const updateCompanySchema = z.object({
  slug: z.string()
    .min(3, "O slug deve ter pelo menos 3 caracteres")
    .regex(/^[a-z0-9-]+$/, "O slug deve conter apenas letras minúsculas, números e hífens"),
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  allowNegativeStock: z.boolean().default(false),
  estimatedMonthlyVolume: z.number().int().min(1).default(1000),
  enableOverheadInjection: z.boolean().default(true),
  bannerUrl: z.string().optional(),
  logoUrl: z.string().optional(),
  address: z.string().optional(),
  description: z.string().optional(),
  whatsappNumber: z.string().optional(),
  instagramUrl: z.string().optional(),
  requireSelfieOnCheckout: z.boolean().default(false),
  operatingHours: z.array(z.object({
    day: z.string(),
    open: z.string(),
    close: z.string(),
    closed: z.boolean(),
  })).optional(),
});

export type UpdateCompanySchema = z.infer<typeof updateCompanySchema>;
