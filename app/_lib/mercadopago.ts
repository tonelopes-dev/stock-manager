import { MercadoPagoConfig } from "mercadopago";

if (!process.env.MERCADO_PAGO_ACCESS_TOKEN) {
  throw new Error("MERCADO_PAGO_ACCESS_TOKEN is missing");
}

export const mpClient = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN,
  options: { timeout: 5000 },
});
