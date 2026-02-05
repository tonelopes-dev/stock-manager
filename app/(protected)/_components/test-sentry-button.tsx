"use client";

import { Button } from "@/app/_components/ui/button";
import { forceErrorAction } from "@/app/_actions/test/force-error";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

export const TestSentryButton = () => {
  const { execute, status } = useAction(forceErrorAction, {
    onError: (error) => {
      console.error("Caught error in UI:", error);
      toast.error("Erro forçado disparado! Verifique o console/Sentry.");
    },
    onSuccess: () => {
      toast.success("Sucesso? Isso não deveria acontecer.");
    },
  });

  return (
    <Button 
      variant="destructive" 
      onClick={() => execute()}
      disabled={status === "executing"}
    >
      TESTAR SENTRY (CRASH)
    </Button>
  );
};
