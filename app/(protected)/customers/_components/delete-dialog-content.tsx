"use client";

import { deleteCustomer } from "@/app/_actions/customer/delete-customer";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface DeleteCustomerDialogContentProps {
  customerId: string;
}

const DeleteCustomerDialogContent = ({
  customerId,
}: DeleteCustomerDialogContentProps) => {
  const { execute: executeDeleteCustomer, status } = useAction(deleteCustomer, {
    onSuccess: () => {
      toast.success("Cliente excluído com sucesso.");
    },
    onError: ({ error: { serverError, validationErrors } }) => {
      const firstError = validationErrors?._errors?.[0] || serverError;
      toast.error(firstError || "Ocorreu um erro ao excluir o cliente.");
    },
  });

  const isPending = status === "executing";

  const handleContinueClick = () => executeDeleteCustomer({ id: customerId });

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
        <AlertDialogDescription>
          Esta ação não pode ser desfeita. Isso excluirá permanentemente o
          cliente do nosso banco de dados.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction asChild>
          <Button
            variant="destructive"
            onClick={handleContinueClick}
            disabled={isPending}
            className="gap-1.5"
          >
            {isPending && <Loader2Icon className="animate-spin" size={16} />}
            Continuar
          </Button>
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default DeleteCustomerDialogContent;
