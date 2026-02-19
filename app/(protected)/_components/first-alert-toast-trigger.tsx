"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { updateFirstAlertSeenAction } from "@/app/_actions/onboarding/update-first-alert-seen";

interface FirstAlertToastTriggerProps {
  firstAlertSeenAt: Date | null;
}

export function FirstAlertToastTrigger({ firstAlertSeenAt }: FirstAlertToastTriggerProps) {
  useEffect(() => {
    if (!firstAlertSeenAt) {
      // Trigger the WOW moment
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ef4444", "#f97316", "#facc15"], // Warning colors
      });

      toast.warning("⚠️ Você acabou de evitar perder uma venda!", {
        description: "Seu estoque atingiu o nível crítico e o Stockly te avisou a tempo de repor.",
        duration: 8000,
      });

      // Update the database so it doesn't trigger again
      updateFirstAlertSeenAction();
    }
  }, [firstAlertSeenAt]);

  return null;
}
