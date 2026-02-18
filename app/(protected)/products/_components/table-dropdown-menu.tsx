import {
  AlertDialog,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  PowerIcon,
  PowerOffIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import DeleteProductDialogContent from "./delete-dialog-content";
import UpsertProductDialogContent from "./upsert-dialog-content";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { toggleProductStatus } from "@/app/_actions/product/toggle-status";
import Link from "next/link";

interface ProductTableDropdownMenuProps {
  product: ProductDto;
}

const ProductTableDropdownMenu = ({
  product,
}: ProductTableDropdownMenuProps) => {
  const [editDialogOpen, setEditDialogIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = async () => {
    startTransition(async () => {
      try {
        await toggleProductStatus({ id: product.id });
        toast.success(
          product.isActive ? "Produto desativado." : "Produto reativado."
        );
      } catch (error) {
        toast.error("Erro ao alterar o status do produto.");
      }
    });
  };

  const hasHistory = (product._count?.saleItems || 0) > 0 || (product._count?.productionOrders || 0) > 0;

  return (
    <AlertDialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogIsOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreHorizontalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/products/${product.id}`} className="gap-1.5">
                <ExternalLinkIcon size={16} />
                Ver Detalhes
              </Link>
            </DropdownMenuItem>
            
            <DropdownMenuItem
              className="gap-1.5"
              onClick={handleToggleStatus}
              disabled={isPending}
            >
              {product.isActive ? (
                <>
                  <PowerOffIcon size={16} />
                  Desativar
                </>
              ) : (
                <>
                  <PowerIcon size={16} />
                  Reativar
                </>
              )}
            </DropdownMenuItem>

            <DialogTrigger asChild>
              <DropdownMenuItem className="gap-1.5">
                <EditIcon size={16} />
                Editar
              </DropdownMenuItem>
            </DialogTrigger>

            {!hasHistory && (
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="gap-1.5 text-red-600 focus:text-red-600 focus:bg-red-50">
                  <TrashIcon size={16} />
                  Deletar
                </DropdownMenuItem>
              </AlertDialogTrigger>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <UpsertProductDialogContent
          defaultValues={{
            id: product.id,
            name: product.name,
            type: product.type,
            price: Number(product.price),
            cost: Number(product.cost),
            sku: product.sku || "",
            stock: product.stock,
            minStock: product.minStock,
          }}
          setDialogIsOpen={setEditDialogIsOpen}
        />
        <DeleteProductDialogContent productId={product.id} />
      </Dialog>
    </AlertDialog>
  );
};

export default ProductTableDropdownMenu;