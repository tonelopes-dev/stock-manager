import { toggleProductStatus } from "@/app/_actions/product/toggle-status";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/app/_components/ui/alert-dialog";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface ToggleStatusDialogContentProps {
  productId: string;
  isActive: boolean;
}

const ToggleStatusDialogContent = ({
  productId,
  isActive,
}: ToggleStatusDialogContentProps) => {
  const { execute: executeToggleStatus } = useAction(toggleProductStatus, {
    onSuccess: () => {
      toast.success(
        isActive ? "Produto desativado com sucesso." : "Produto reativado com sucesso."
      );
    },
    onError: ({ error: { serverError } }) => {
      toast.error(serverError || "Ocorreu um erro ao alterar o status do produto.");
    },
  });

  const handleContinueClick = () => executeToggleStatus({ id: productId });

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {isActive ? "Desativar Produto?" : "Reativar Produto?"}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {isActive
            ? "Ao desativar este produto, ele não aparecerá mais para novas vendas ou produções, mas seu histórico permanecerá intacto. Deseja continuar?"
            : "Ao reativar este produto, ele voltará a aparecer nas listagens de vendas e produções. Deseja continuar?"}
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancelar</AlertDialogCancel>
        <AlertDialogAction onClick={handleContinueClick}>
          Continuar
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default ToggleStatusDialogContent;
