"use client";

import React, { createContext, useContext, useState } from "react";
import { SubscriptionLevel } from "@/lib/subscription";

interface SubscriptionContextType {
  isBannerVisible: boolean;
  setIsBannerVisible: (visible: boolean) => void;
  toggleBanner: () => void;
  subscriptionLevel: SubscriptionLevel;
  daysRemaining: number;
  expiresAt: Date | null;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(
  undefined,
);

export const SubscriptionProvider = ({
  children,
  subscriptionLevel,
  daysRemaining,
  expiresAt,
}: {
  children: React.ReactNode;
  subscriptionLevel: SubscriptionLevel;
  daysRemaining: number;
  expiresAt: Date | null;
}) => {
  const [isBannerVisible, setIsBannerVisible] = useState(false);

  const toggleBanner = () => setIsBannerVisible((prev) => !prev);

  return (
    <SubscriptionContext.Provider
      value={{
        isBannerVisible,
        setIsBannerVisible,
        toggleBanner,
        subscriptionLevel,
        daysRemaining,
        expiresAt,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider",
    );
  }
  return context;
};
