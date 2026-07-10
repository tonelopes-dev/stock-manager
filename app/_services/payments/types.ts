/**
 * Payment Domain Types
 *
 * Central source of truth for all payment-related DTOs and interfaces.
 * No business logic here — pure type definitions only.
 */


// ─────────────────────────────────────────────
// Webhook Payloads
// ─────────────────────────────────────────────

export interface IMercadoPagoWebhookBody {
  type?: string;
  topic?: string;
  id?: string;
  data?: {
    id?: string;
  };
}

// ─────────────────────────────────────────────
// Gateway Inputs & Outputs
// ─────────────────────────────────────────────

export interface ICreateCheckoutInput {
  companyId: string;
  /** IDs of Orders being grouped into this checkout */
  orderIds: string[];
  /** If paying an existing SETTLED_LATER Sale */
  saleId?: string;
  amount: number;
  description: string;
  /** Return URL after payment is completed */
  returnUrl: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface ICheckoutResult {
  /** URL to redirect the customer to (Checkout Pro) */
  checkoutUrl: string;
  /** The external preference/intent ID from the provider */
  externalId: string;
}

export interface IPixResult {
  /** Base64-encoded QR Code image */
  qrCodeBase64: string;
  /** "Copia e Cola" PIX string */
  copyPasteCode: string;
  /** External payment ID from the provider */
  externalId: string;
}

export interface IInPersonPaymentResult {
  /** External payment ID from the provider */
  externalId: string;
  /** Current status of the in-person payment intent */
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
}

// ─────────────────────────────────────────────
// Payment Gateway Interface
// ─────────────────────────────────────────────

/**
 * Adapter interface for all payment providers.
 * Any new provider (Stone, InfinityPay, etc.) must implement this contract.
 */
export interface IPaymentGateway {
  /** Create an online Checkout Pro redirect URL */
  createCheckout(input: ICreateCheckoutInput): Promise<ICheckoutResult>;

  /** Generate a dynamic PIX QR Code for a specific amount */
  generateDynamicPix(amount: number, description: string, externalReference: string): Promise<IPixResult>;

  /** Dispatch a payment intent to a physical POS device (Point API) */
  createInPersonPaymentIntent(
    amount: number,
    deviceId: string,
    description: string
  ): Promise<IInPersonPaymentResult>;

  getPayment(paymentId: string | number): Promise<any>;

  /**
   * Processes a direct payment (e.g. from Bricks or custom checkout)
   */
  createPayment(formData: any): Promise<any>;
}

// ─────────────────────────────────────────────
// Payment Event (Idempotency)
// ─────────────────────────────────────────────

export interface IPaymentEventRecord {
  id: string;
  companyId: string;
  provider: string;
  eventType: string;
  status: "processed" | "failed";
  payload: Record<string, unknown>;
}
