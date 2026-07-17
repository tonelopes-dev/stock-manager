import "server-only";

import { db } from "@/app/_lib/prisma";
import { OrderService, ConvertToSaleInput } from "@/app/_services/order";
import { broadcastEvent } from "@/app/_lib/broadcast";
import { broadcastKdsEvent } from "@/app/_lib/kds-broadcast";
import { PaymentMethod } from "@prisma/client";

const LOG = "[PaymentCompletion]";

/**
 * Input for completing an online payment (PIX, Card, Wallet).
 * Used by both the Bricks "approved instantly" path and the Webhook handler.
 */
export interface CompleteOnlinePaymentInput {
  orderIds: string[];
  companyId: string;
  paymentMethod: PaymentMethod;
  customerId: string | null;
  /** Orders with their items — needed to calculate service tax (tip) */
  orders: {
    id: string;
    customerId: string | null;
    hasServiceTax: boolean;
    orderItems: { unitPrice: unknown; quantity: unknown }[];
  }[];
  // ── Split / Take Rate (future-ready) ──
  platformFeeRate?: number;
  platformFeeAmount?: number;
  netAmount?: number;
  externalPaymentId?: string;
  paymentProvider?: string;
}

/**
 * PaymentCompletionService
 *
 * Single Responsibility: the shared orchestrator that converts orders into a Sale
 * after an online payment is approved, then broadcasts real-time events.
 *
 * This eliminates the duplication between:
 *  - process-transparent-payment.ts (Bricks instant approval)
 *  - tenant-payment.handler.ts (Webhook deferred approval)
 */
export const PaymentCompletionService = {
  /**
   * Calculates the 10% service tax (tip) based on each order's items.
   * Only applies to orders where `hasServiceTax === true`.
   */
  calculateServiceTax(
    orders: { hasServiceTax: boolean; orderItems: { unitPrice: unknown; quantity: unknown }[] }[]
  ): number {
    const tipCents = orders.reduce((sumCents, order) => {
      if (!order.hasServiceTax) return sumCents;
      
      // Converte o subtotal rigorosamente para centavos antes de calcular a porcentagem
      const subtotalCents = order.orderItems.reduce(
        (sCents, item) => sCents + Math.round(Number(item.unitPrice) * Number(item.quantity) * 100),
        0
      );
      
      const orderTipCents = Math.round(subtotalCents * 0.1);
      return sumCents + orderTipCents;
    }, 0);
    
    return tipCents / 100;
  },

  /**
   * Completes an online payment:
   *  1. Calculates the service tax (tip)
   *  2. Converts orders into a Sale via OrderService.convertToSale
   *  3. Broadcasts real-time events (customer + KDS)
   *
   * Returns the created Sale.
   */
  async completeOnlinePayment(input: CompleteOnlinePaymentInput) {
    const {
      orderIds, companyId, paymentMethod, customerId, orders,
      platformFeeRate, platformFeeAmount, netAmount, externalPaymentId, paymentProvider,
    } = input;

    // 1. Calculate tip from order items
    const tipAmount = this.calculateServiceTax(orders);
    console.log(`${LOG} Calculated tipAmount=R$${tipAmount.toFixed(2)} for ${orders.length} order(s)`);

    // 2. Convert orders → Sale (single source of truth)
    const saleInput: ConvertToSaleInput = {
      orderIds,
      companyId,
      userId: null, // Online payments have no operator
      paymentMethod,
      tipAmount,
      status: "ACTIVE",
      customerId,
      // Future-ready Split fields (will be persisted after migration)
      platformFeeRate,
      platformFeeAmount,
      netAmount,
      externalPaymentId,
      paymentProvider,
    };

    const sale = await OrderService.convertToSale(saleInput);
    console.log(`${LOG} ✅ Sale created: id=${sale.id}`);

    // 3. Broadcast real-time events
    for (const order of orders) {
      if (order.customerId) {
        await broadcastEvent(`customer-${order.customerId}`, "order_status_update", {
          orderId: order.id,
          status: "PAID",
        });
      }
      await broadcastKdsEvent(companyId, "update_order", { id: order.id, status: "PAID" });
    }
    console.log(`${LOG} ✅ ${orders.length} order(s) broadcast as PAID.`);

    return sale;
  },
};
