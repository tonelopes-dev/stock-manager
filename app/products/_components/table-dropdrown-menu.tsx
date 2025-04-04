import { Button } from "@/app/_components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/app/_components/ui/dropdown-menu";
import {
  MoreHorizontalIcon,
  ClipboardCopyIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { useState } from "react";
import AlertDeleteDialog from "./delete-dialog";
import UpsertProductDialogContent from "./upsert-dialog-content";
import { Product } from "@prisma/client";

interface ProductsTablePropsDropdownMenuProps {
  product: Product;
}
export const TableDropdrownMenu = ({
  product,
}: ProductsTablePropsDropdownMenuProps) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  return (
    <AlertDialog>
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreHorizontalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(product.id)}
            >
              <ClipboardCopyIcon className="mr-2 h-4 w-4" />
              Copiar ID
            </DropdownMenuItem>
            <DialogTrigger asChild>
              <DropdownMenuItem>
                <EditIcon className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            </DialogTrigger>
            {/* DELETE BUTTON ACTION */}
            <AlertDialogTrigger asChild>
              <DropdownMenuItem>
                <Button>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        {/* CONTENT BUTTON DIALOG DELETE and EDIT */}
        <UpsertProductDialogContent
          defaultValues={{
            id: product.id,
            name: product.name,
            price: Number(product.price),
            stock: product.stock,
          }}
          onSucess={() => setEditDialogOpen(false)}
        />
        <AlertDeleteDialog productId={product.id} />
      </Dialog>
    </AlertDialog>
  );
};
