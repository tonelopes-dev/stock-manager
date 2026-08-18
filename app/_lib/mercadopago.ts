import "server-only";

import { MercadoPagoConfig, Preference } from "mercadopago";
import type { PreferenceRequest } from "mercadopago/dist/clients/preference/commonTypes";
import { Items } from "mercadopago/dist/clients/commonTypes";

interface MercadoPagoCheckoutParams {
  accessToken: string;
  items: Items[];
  external_reference: string;
  notification_url: string;
  back_urls: {
    success: string;
    pending: string;
    failure: string;
  };
  payer?: {
    name?: string;
    email?: string;
    phone?: {
      area_code?: string;
      number?: string;
    };
  };
  marketplace_fee?: number;
}

export async function createMercadoPagoPreference(params: MercadoPagoCheckoutParams): Promise<{ url: string; id: string }> {
  const client = new MercadoPagoConfig({
    accessToken: params.accessToken,
    options: { timeout: 10000 },
  });

  const preference = new Preference(client);

  const body: PreferenceRequest = {
    items: params.items,
    external_reference: params.external_reference,
    notification_url: params.notification_url,
    back_urls: params.back_urls,
    auto_return: "approved",
    statement_descriptor: "KIPO",
  };
  
  if (params.payer) {
    body.payer = params.payer;
  }
  if (params.marketplace_fee !== undefined) {
    body.marketplace_fee = params.marketplace_fee;
  }

  try {
    const result = await preference.create({ body });
    // result.init_point contains the url for the hosted checkout (production)
    if (!result.init_point) {
      throw new Error("Mercado Pago não retornou uma URL de checkout.");
    }
    return { url: result.init_point!, id: result.id! };
  } catch (error) {
    console.error("[MercadoPago Error] Erro ao criar preferência:", error);
    throw new Error("Falha ao gerar link de pagamento no Mercado Pago");
  }
}

// Kipo's own Mercado Pago client for Kipo Pro subscriptions
const MP_ACCESS_TOKEN = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";
export const mpClient = new MercadoPagoConfig({
  accessToken: MP_ACCESS_TOKEN,
  options: { timeout: 10000 },
});

