import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";
import {
  IPaymentGateway,
  ICreateCheckoutInput,
  ICheckoutResult,
  IPixResult,
  IInPersonPaymentResult,
} from "./types";

/**
 * MercadoPagoGateway
 *
 * Single Responsibility: all communication with the Mercado Pago API.
 * This is the concrete implementation of the IPaymentGateway interface for MP.
 * Business logic (order grouping, tip calculation, etc.) does NOT belong here.
 *
 * Usage: instantiate with the tenant's Access Token (not the Kipo master token).
 */
export class MercadoPagoGateway implements IPaymentGateway {
  private readonly client: MercadoPagoConfig;

  constructor(accessToken: string) {
    this.client = new MercadoPagoConfig({ accessToken });
  }

  /**
   * Creates a Checkout Pro preference and returns the redirect URL.
   */
  async createCheckout(input: ICreateCheckoutInput): Promise<ICheckoutResult> {
    const preference = new Preference(this.client);

    const response = await preference.create({
      body: {
        items: [
          {
            id: input.orderIds[0] ?? input.saleId ?? "unknown",
            title: input.description,
            quantity: 1,
            currency_id: "BRL",
            unit_price: input.amount,
          },
        ],
        // The external_reference is what we use to identify the payment in the webhook.
        // We use the PaymentIntent ID (set by the caller).
        external_reference: input.orderIds[0] ?? input.saleId,
        notification_url: `${this._cleanUrl(process.env.NEXT_PUBLIC_APP_URL)}/api/webhooks/mercadopago?companyId=${input.companyId}`,
        back_urls: {
          success: input.returnUrl,
          pending: input.returnUrl,
          failure: input.returnUrl,
        },
        auto_return: "approved",
        ...(input.customer && {
          payer: {
            name: input.customer.name,
            email: input.customer.email,
          },
        }),
      },
    });

    const checkoutUrl = response.sandbox_init_point ?? response.init_point;
    const externalId = response.id;

    if (!checkoutUrl || !externalId) {
      throw new Error("[MercadoPagoGateway] Failed to create preference: no URL returned.");
    }

    return { checkoutUrl, externalId };
  }

  /**
   * Generates a dynamic PIX QR Code.
   * Returns the base64 image and the "Copia e Cola" string.
   */
  async generateDynamicPix(amount: number, description: string, externalReference: string): Promise<IPixResult> {
    const payment = new Payment(this.client);

    const response = await payment.create({
      body: {
        transaction_amount: amount,
        description,
        payment_method_id: "pix",
        external_reference: externalReference,
        payer: {
          // PIX requires at least a payer email; in practice the tenant may provide a real email
          email: "pix@kipo.app",
        },
      },
    });

    const qrCodeBase64 = response.point_of_interaction?.transaction_data?.qr_code_base64;
    const copyPasteCode = response.point_of_interaction?.transaction_data?.qr_code;
    const externalId = response.id?.toString();

    if (!qrCodeBase64 || !copyPasteCode || !externalId) {
      throw new Error("[MercadoPagoGateway] Failed to generate PIX: incomplete response from MP.");
    }

    return { qrCodeBase64, copyPasteCode, externalId };
  }

  /**
   * Dispatches a payment intent to a physical Point device (POS/maquininha).
   * The device must already be registered/paired in the MP account.
   *
   * Note: This requires the Point Integration scope on the Access Token.
   */
  async createInPersonPaymentIntent(
    amount: number,
    deviceId: string,
    description: string
  ): Promise<IInPersonPaymentResult> {
    // TODO: Implement Point API integration (Phase 4)
    // See: https://www.mercadopago.com.br/developers/pt/docs/point/api
    throw new Error(
      "[MercadoPagoGateway] In-person payments (Point API) not yet implemented. Coming in Phase 4."
    );
  }

  /**
   * Fetches a payment by its ID from the MP API.
   * Used in webhook handlers to verify payment status server-to-server.
   */
  async getPayment(paymentId: string) {
    const payment = new Payment(this.client);
    return payment.get({ id: paymentId });
  }

  /**
   * Processes a direct payment (from Mercado Pago Bricks token)
   */
  async createPayment(formData: any): Promise<any> {
    const payment = new Payment(this.client);
    
    const response = await payment.create({
      body: formData,
    });
    
    return response;
  }

  private _cleanUrl(url?: string): string {
    return (url ?? "http://localhost:3000").replace(/['"]/g, "").replace(/\/$/, "").trim();
  }
}
