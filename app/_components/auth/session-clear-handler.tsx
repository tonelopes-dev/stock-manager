"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";

export const SessionClearHandler = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reason = searchParams.get("reason");

  useEffect(() => {
    if (reason === "ownership_transferred") {
      // 1. Clear all storage
      localStorage.clear();
      sessionStorage.clear();

      // 2. Clear cookies via a hacky way (if not HttpOnly)
      // but the middleware handles the HttpOnly ones.

      console.log(
        "[Auth] Force clearing browser state due to ownership transfer.",
      );

      // 3. Optional: toast for feedback
      toast.info(
        "Sessão reiniciada por segurança devido à mudança de permissões.",
        {
          description: "Por favor, entre novamente se necessário.",
          duration: 6000,
        },
      );

      // 4. Remove the reason from URL to prevent infinite re-clearing if they refresh
      // but we wait a bit to ensure the message is seen or the redirect is stable.
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [reason, router]);

  return null;
};
