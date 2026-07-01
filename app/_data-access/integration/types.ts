import { IntegrationProvider } from "@prisma/client";

export interface CompanyIntegrationDto {
  id: string;
  provider: IntegrationProvider;
  isEnabled: boolean;
  // Apenas dados públicos / descritografados seguros devem vir pro DTO
  // O webhookSecret NUNCA é enviado ao frontend.
  config: {
    merchantId?: string;
    accessToken?: string;
    publicKey?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Tipo de entrada para os dados criptografados brutos do banco
export type EncryptedCredentials = {
  merchantId?: string;
  accessToken?: string;
  publicKey?: string;
};
