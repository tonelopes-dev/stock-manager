import {
  AlertDialog,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { Dialog } from "@/app/_components/ui/dialog";
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
import ToggleStatusDialogContent from "./toggle-status-dialog-content";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { toggleProductStatus } from "@/app/_actions/product/toggle-status";
import Link from "next/link";
import { UserRole } from "@prisma/client";


interface ProductTableDropdownMenuProps {
  product: ProductDto;
  userRole: UserRole;
}

const ProductTableDropdownMenu = ({
  product,
  userRole,
}: ProductTableDropdownMenuProps) => {

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = async () => {
    // Re-activate directly, deactivate with confirmation
    if (product.isActive) {
      setToggleStatusDialogOpen(true);
      return;
    }

    startTransition(async () => {
      try {
        await toggleProductStatus({ id: product.id });
        toast.success("Produto reativado com sucesso.");
      } catch (error) {
        toast.error("Erro ao reativar o produto.");
      }
    });
  };

  const hasHistory = (product._count?.saleItems || 0) > 0 || (product._count?.productionOrders || 0) > 0;

  return (
    <>
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
          
          {userRole !== UserRole.MEMBER && (
            <>
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

              <DropdownMenuItem 
                className="gap-1.5"
                onClick={() => setEditDialogOpen(true)}
              >
                <EditIcon size={16} />
                Editar
              </DropdownMenuItem>

              {!hasHistory && (
                <DropdownMenuItem 
                  className="gap-1.5 text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <TrashIcon size={16} />
                  Deletar
                </DropdownMenuItem>
              )}
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>


      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
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
          setDialogIsOpen={setEditDialogOpen}
        />
      </Dialog>

      {/* Toggle Status Confirmation (Deactivate) */}
      <AlertDialog open={toggleStatusDialogOpen} onOpenChange={setToggleStatusDialogOpen}>
        <ToggleStatusDialogContent productId={product.id} isActive={product.isActive} />
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteProductDialogContent productId={product.id} />
      </AlertDialog>
    </>
  );
};

export default ProductTableDropdownMenu;
