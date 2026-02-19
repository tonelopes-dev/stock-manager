"use client";

import { useAction } from "next-safe-action/hooks";
import { restoreCompany } from "@/app/_actions/company/delete-company";
import { Button } from "@/app/_components/ui/button";

import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export function RestoreButton() {
  const router = useRouter();
  const { update } = useSession();

  const { execute, isPending } = useAction(restoreCompany, {
    onSuccess: async () => {
      toast.success("Empresa restaurada com sucesso!");
      // Force session update to clear companyDeletedAt in middleware
      await update();
      router.push("/dashboard");
      router.refresh();
    },
    onError: ({ error }) => {
      toast.error(error.serverError || "Erro ao restaurar a empresa.");
    },
  });

  return (
    <Button 
      onClick={() => execute({})} 
      disabled={isPending}
      className="w-full gap-2"
    >
      <RotateCcw className="h-4 w-4" />
      {isPending ? "Restaurando..." : "Restaurar Empresa Agora"}
    </Button>
  );
}
