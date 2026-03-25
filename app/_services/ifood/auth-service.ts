import { db } from "@/app/_lib/prisma";
import { BusinessError } from "@/app/_lib/errors";

interface IfoodTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export class IfoodAuthService {
  private static AUTH_URL = "https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token";

  /**
   * Retrieves a valid access token for the specified company.
   * If the current token is expired or missing, it performs a refresh/re-authentication.
   */
  static async getAccessToken(companyId: string): Promise<string> {
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        ifoodClientId: true,
        ifoodClientSecret: true,
        ifoodAccessToken: true,
        ifoodTokenExpiry: true,
      },
    });

    if (!company || !company.ifoodClientId || !company.ifoodClientSecret) {
      throw new BusinessError(
        "Configurações do iFood ausentes para esta empresa. Verifique o Client ID e Client Secret."
      );
    }

    // Check if current token is still valid (with a 5-minute safety margin)
    const now = new Date();
    const safetyMargin = 5 * 60 * 1000; // 5 minutes
    
    if (
      company.ifoodAccessToken && 
      company.ifoodTokenExpiry && 
      new Date(company.ifoodTokenExpiry).getTime() > now.getTime() + safetyMargin
    ) {
      return company.ifoodAccessToken;
    }

    // Token is expired or missing, let's authenticate
    return this.authenticate(companyId, company.ifoodClientId, company.ifoodClientSecret);
  }

  /**
   * Performs the OAuth authentication with iFood.
   */
  private static async authenticate(
    companyId: string, 
    clientId: string, 
    clientSecret: string
  ): Promise<string> {
    try {
      const params = new URLSearchParams();
      params.append("grantType", "client_credentials");
      params.append("clientId", clientId);
      params.append("clientSecret", clientSecret);

      const response = await fetch(this.AUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("iFood Auth Error Response:", errorData);
        throw new BusinessError(
          `Falha na autenticação com iFood: ${errorData.error?.message || response.statusText}`
        );
      }

      const data: IfoodTokenResponse = await response.json();
      
      // Calculate expiry date
      const expiryDate = new Date(Date.now() + data.expiresIn * 1000);

      // Persist the new token
      await db.company.update({
        where: { id: companyId },
        data: {
          ifoodAccessToken: data.accessToken,
          ifoodRefreshToken: data.refreshToken || null,
          ifoodTokenExpiry: expiryDate,
        },
      });

      console.log(`[iFood] Token atualizado para a empresa ${companyId}. Expira em: ${expiryDate}`);

      return data.accessToken;
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      
      console.error("[iFood] Erro fatal no serviço de autenticação:", error);
      throw new Error("Erro interno ao tentar autenticar com a API do iFood.");
    }
  }
}
