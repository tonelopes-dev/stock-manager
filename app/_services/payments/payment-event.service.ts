import "server-only";
import { db } from "@/app/_lib/prisma";
import { IntegrationProvider } from "@prisma/client";
import { IPaymentEventRecord } from "./types";

/**
 * PaymentEventService
 *
 * Single Responsibility: ensure webhook idempotency.
 * Records processed webhook events and allows callers to check
 * if an event has already been handled, preventing double-processing.
 */
export const PaymentEventService = {
  /**
   * Returns true if this event has already been processed.
   * The `id` should be the payment provider's own event/payment ID.
   */
  async hasBeenProcessed(id: string): Promise<boolean> {
    const existing = await db.paymentEvent.findUnique({ where: { id } });
    return existing !== null;
  },

  /**
   * Records a successfully processed webhook event.
   */
  async markAsProcessed(
    record: Omit<IPaymentEventRecord, "status"> & { payload: any }
  ): Promise<void> {
    await db.paymentEvent.create({
      data: {
        id: record.id,
        companyId: record.companyId,
        provider: record.provider,
        eventType: record.eventType,
        status: "processed",
        payload: record.payload,
      },
    });
  },

  /**
   * Records a webhook event that failed to process.
   * Useful for auditing and debugging.
   */
  async markAsFailed(
    record: Omit<IPaymentEventRecord, "status"> & { payload: any }
  ): Promise<void> {
    await db.paymentEvent.upsert({
      where: { id: record.id },
      create: {
        id: record.id,
        companyId: record.companyId,
        provider: record.provider,
        eventType: record.eventType,
        status: "failed",
        payload: record.payload,
      },
      update: { status: "failed" },
    });
  },
};
