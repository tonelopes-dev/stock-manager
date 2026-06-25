"use client";

import { useCallback, useEffect, useState } from "react";

type PushPermissionState = "prompt" | "granted" | "denied" | "unsupported";

interface UsePushNotificationsOptions {
  customerId: string | null;
  companyId: string;
  /** If true, auto-subscribes when permission is already granted */
  autoSubscribe?: boolean;
}

interface UsePushNotificationsReturn {
  permission: PushPermissionState;
  isSubscribed: boolean;
  isLoading: boolean;
  requestPermissionAndSubscribe: () => Promise<boolean>;
}

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/**
 * Converts a base64 URL-safe string to a Uint8Array for the push subscription.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Hook for managing Web Push Notifications subscription lifecycle.
 * Handles permission requests, subscription creation, and backend sync.
 */
export function usePushNotifications({
  customerId,
  companyId,
  autoSubscribe = false,
}: UsePushNotificationsOptions): UsePushNotificationsReturn {
  const [permission, setPermission] = useState<PushPermissionState>("prompt");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check initial state
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPermission("unsupported");
      return;
    }

    setPermission(Notification.permission as PushPermissionState);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((registration) => {
      registration.pushManager.getSubscription().then((subscription) => {
        setIsSubscribed(!!subscription);
      });
    });
  }, []);

  // Auto-subscribe when permission is already granted
  useEffect(() => {
    if (
      autoSubscribe &&
      permission === "granted" &&
      !isSubscribed &&
      customerId &&
      VAPID_PUBLIC_KEY
    ) {
      subscribeOnServer();
    }
  }, [autoSubscribe, permission, isSubscribed, customerId]);

  const subscribeOnServer = useCallback(async (): Promise<boolean> => {
    if (!customerId || !VAPID_PUBLIC_KEY) return false;

    setIsLoading(true);

    try {
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }

      const subscriptionJSON = subscription.toJSON();

      if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
        console.error("[Push] Invalid subscription object");
        return false;
      }

      // Send subscription to backend
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscription: {
            endpoint: subscriptionJSON.endpoint,
            keys: {
              p256dh: subscriptionJSON.keys.p256dh,
              auth: subscriptionJSON.keys.auth,
            },
          },
          customerId,
          companyId,
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("[Push] Subscription failed:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [customerId, companyId]);

  const requestPermissionAndSubscribe =
    useCallback(async (): Promise<boolean> => {
      if (permission === "unsupported" || permission === "denied") {
        return false;
      }

      setIsLoading(true);

      try {
        const result = await Notification.requestPermission();
        setPermission(result as PushPermissionState);

        if (result === "granted") {
          return await subscribeOnServer();
        }

        return false;
      } catch (error) {
        console.error("[Push] Permission request failed:", error);
        return false;
      } finally {
        setIsLoading(false);
      }
    }, [permission, subscribeOnServer]);

  return {
    permission,
    isSubscribed,
    isLoading,
    requestPermissionAndSubscribe,
  };
}
