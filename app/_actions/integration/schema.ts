import { z } from "zod";
import { IntegrationProvider } from "@prisma/client";


export const toggleIntegrationSchema = z.object({
  id: z.string().min(1),
  companyId: z.string().min(1),
  isEnabled: z.boolean(),
});

export const upsertMercadoPagoSchema = z.object({
  provider: z.literal("MERCADOPAGO"), // Usa string literal para evitar quebra caso o Prisma client n tenha sido gerado
  companyId: z.string().min(1),
  accessToken: z.string().trim().min(10, "O Access Token é obrigatório"),
  publicKey: z.string().trim().min(10, "A Public Key é obrigatória"),
  isEnabled: z.boolean().default(false),
});

export const toggleMpCheckoutSchema = z.object({
  companyId: z.string().min(1),
  isEnabled: z.boolean(),
});
