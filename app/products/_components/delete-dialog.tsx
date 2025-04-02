import { deleteProduct } from "@/app/_actions/product/delete-product";
import {
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/app/_components/ui/alert-dialog";
import { toast } from "sonner";

interface AlertDeleteDialogProps {
  productId: string;
}

const AlertDeleteDialog = ({ productId }: AlertDeleteDialogProps) => {
  const handleDelete = async () => {
    try {
      await deleteProduct({ id: productId });
      toast.success("Produto excluido com sucesso!");
    } catch (error) {
      console.log(error);
      toast.error("Erro ao excluir produto!");
    }
  };
  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
        <AlertDialogDescription>
          Essa ação não pode ser desfeita.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel>Cancel</AlertDialogCancel>
        <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
};

export default AlertDeleteDialog;
