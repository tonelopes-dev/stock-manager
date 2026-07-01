import { z } from "zod";
import { IntegrationProvider } from "@prisma/client";

export const upsertInfinityPaySchema = z.object({
  provider: z.literal(IntegrationProvider.INFINITYPAY),
  companyId: z.string().min(1),
  merchantId: z.string().min(3, "O Handle é obrigatório"),
  isEnabled: z.boolean().default(false),
});

export const toggleIntegrationSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  isEnabled: z.boolean(),
});
