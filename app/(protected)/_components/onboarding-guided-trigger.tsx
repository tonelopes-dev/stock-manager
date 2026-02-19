"use client";

import { useState, useEffect } from "react";
import { Dialog } from "@/app/_components/ui/dialog";
import UpsertProductDialogContent from "@/app/(protected)/products/_components/upsert-dialog-content";

interface OnboardingGuidedTriggerProps {
  hasProducts: boolean;
}

export function OnboardingGuidedTrigger({ hasProducts }: OnboardingGuidedTriggerProps) {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  useEffect(() => {
    // If user has no products, auto-open the creation modal after a short delay
    if (!hasProducts) {
      const timer = setTimeout(() => {
        setDialogIsOpen(true);
      }, 1500); // 1.5s delay for better UX
      return () => clearTimeout(timer);
    }
  }, [hasProducts]);

  if (hasProducts) return null;

  const demoProduct = {
    id: "",
    name: "Brownie Gourmet",
    type: "RESELL" as const,
    price: 12.50,
    cost: 5.00,
    sku: "BRW-001",
    stock: 20,
    minStock: 5,
  };

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <UpsertProductDialogContent 
        setDialogIsOpen={setDialogIsOpen} 
        defaultValues={demoProduct}
      />
    </Dialog>
  );
}
