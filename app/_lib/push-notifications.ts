import "server-only";

import { db } from "@/app/_lib/prisma";
import webPush from "web-push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;

webPush.setVapidDetails(
  "mailto:suporte@kipo.app",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  url?: string;
  orderId?: string;
  orderNumber?: number;
}

/**
 * Sends a push notification to all devices of a given customer.
 * Automatically removes expired/invalid subscriptions (HTTP 410).
 */
export async function sendPushToCustomer(
  customerId: string,
  companyId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number; cleaned: number }> {
  const subscriptions = await db.pushSubscription.findMany({
    where: { customerId, companyId },
    select: {
      id: true,
      endpoint: true,
      p256dh: true,
      auth: true,
    },
  });

  if (subscriptions.length === 0) {
    return { sent: 0, failed: 0, cleaned: 0 };
  }

  const jsonPayload = JSON.stringify(payload);
  let sent = 0;
  let failed = 0;
  const expiredIds: string[] = [];

  const results = await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webPush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          jsonPayload,
          { TTL: 60 * 60 } // 1 hour TTL
        );
        sent++;
      } catch (error: unknown) {
        const statusCode = (error as { statusCode?: number })?.statusCode;

        // 404 or 410 means the subscription is no longer valid
        if (statusCode === 404 || statusCode === 410) {
          expiredIds.push(sub.id);
        }
        failed++;
      }
    })
  );

  // Clean up expired subscriptions
  if (expiredIds.length > 0) {
    await db.pushSubscription.deleteMany({
      where: { id: { in: expiredIds } },
    });
  }

  console.log(
    `[Push] Customer ${customerId} | Sent: ${sent} | Failed: ${failed} | Cleaned: ${expiredIds.length}`
  );

  return { sent, failed, cleaned: expiredIds.length };
}
