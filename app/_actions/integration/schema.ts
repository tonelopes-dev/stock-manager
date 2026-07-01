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

export const upsertMercadoPagoSchema = z.object({
  provider: z.literal("MERCADOPAGO"), // Usa string literal para evitar quebra caso o Prisma client n tenha sido gerado
  companyId: z.string().min(1),
  accessToken: z.string().min(10, "O Access Token é obrigatório"),
  publicKey: z.string().min(10, "A Public Key é obrigatória"),
  isEnabled: z.boolean().default(false),
});
