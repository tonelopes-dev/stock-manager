"use client";

import { useAction } from "next-safe-action/hooks";
import { acceptInvitation } from "@/app/_actions/user/accept-invitation";
import { Button } from "@/app/_components/ui/button";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AcceptInvitationButtonProps {
  invitationId: string;
}

const AcceptInvitationButton = ({ invitationId }: AcceptInvitationButtonProps) => {
  const router = useRouter();
  const { execute, isPending } = useAction(acceptInvitation, {
    onSuccess: () => {
      toast.success("Bem-vindo à equipe!");
      router.push("/dashboard");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao aceitar convite.");
    },
  });

  return (
    <Button 
      className="w-full font-bold h-12 text-lg shadow-lg shadow-primary/20" 
      onClick={() => execute({ invitationId })}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2Icon className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        "Aceitar Convite"
      )}
    </Button>
  );
};

export default AcceptInvitationButton;
