import { AlertDialog } from "@/app/_components/ui/alert-dialog";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/app/_components/ui/tooltip";
import {
  MoreHorizontalIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  PowerIcon,
  PowerOffIcon,
  PackagePlusIcon,
} from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import DeleteProductDialogContent from "./delete-dialog-content";
import UpsertProductDialogContent from "./upsert-dialog-content";
import ToggleStatusDialogContent from "./toggle-status-dialog-content";
import AdjustStockDialogContent from "./adjust-stock-dialog-content";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { toggleProductStatus } from "@/app/_actions/product/toggle-status";
import Link from "next/link";
import { UserRole } from "@prisma/client";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";

interface ProductTableDropdownMenuProps {
  product: ProductDto;
  userRole: UserRole;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
  overheadSettings: {
    enableOverheadInjection: boolean;
    overheadRate: number;
  } | null;
}

const ProductTableDropdownMenu = ({
  product,
  userRole,
  categories,
  environments,
  overheadSettings,
}: ProductTableDropdownMenuProps) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [adjustStockDialogOpen, setAdjustStockDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [toggleStatusDialogOpen, setToggleStatusDialogOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggleStatus = async () => {
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

  const hasHistory =
    (product._count?.saleItems || 0) > 0 ||
    (product._count?.productionOrders || 0) > 0;

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
            <Link href={`/cardapio/${product.id}`} className="gap-1.5">
              <ExternalLinkIcon size={16} />
              Ver Detalhes
            </Link>
          </DropdownMenuItem>

          {userRole !== UserRole.MEMBER && (
            <>
              <DropdownMenuItem
                className="gap-1.5"
                onClick={() => setEditDialogOpen(true)}
              >
                <EditIcon size={16} />
                Editar
              </DropdownMenuItem>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span 
                      className="w-full" 
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                      }}
                    >
                      <DropdownMenuItem
                        className="gap-1.5 w-full"
                        onClick={() => setAdjustStockDialogOpen(true)}
                        disabled={product.isMadeToOrder}
                      >
                        <PackagePlusIcon size={16} />
                        Ajustar Estoque
                      </DropdownMenuItem>
                    </span>
                  </TooltipTrigger>
                  {product.isMadeToOrder && (
                    <TooltipContent side="left" className="max-w-[300px] bg-primary text-primary-foreground border-none">
                      <p className="text-xs">
                        O estoque deste produto é calculado automaticamente através da sua Ficha Técnica (Feito na Hora).
                      </p>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>

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

              {!hasHistory && (
                <DropdownMenuItem
                  className="gap-1.5 text-destructive focus:bg-destructive/10 focus:text-destructive"
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

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <UpsertProductDialogContent
          defaultValues={{
            id: product.id,
            name: product.name,
            type: product.type,
            price: Number(product.price),
            cost: Number(product.cost),
            operationalCost: Number(product.operationalCost),
            sku: product.sku || "",
            stock: product.stock,
            minStock: product.minStock,
            unit: product.unit,
            categoryId: product.categoryId || "",
            environmentId: product.environmentId || "",
            expirationDate: product.expirationDate ? new Date(product.expirationDate) : undefined,
            trackExpiration: product.trackExpiration,
            imageUrl: product.imageUrl || "",
            isMadeToOrder: product.isMadeToOrder,
            promoPrice: product.promoPrice || undefined,
            promoActive: product.promoActive || false,
            isFeatured: product.isFeatured || false,
          }}
          setDialogIsOpen={setEditDialogOpen}
          categories={categories}
          environments={environments}
          overheadSettings={overheadSettings}
        />
      </Dialog>

      {/* Adjust Stock Dialog */}
      <Dialog
        open={adjustStockDialogOpen}
        onOpenChange={setAdjustStockDialogOpen}
      >
        <AdjustStockDialogContent
          productId={product.id}
          productName={product.name}
          currentStock={product.stock}
          unit={product.unit}
          setDialogIsOpen={setAdjustStockDialogOpen}
        />
      </Dialog>

      {/* Toggle Status Confirmation (Deactivate) */}
      <AlertDialog
        open={toggleStatusDialogOpen}
        onOpenChange={setToggleStatusDialogOpen}
      >
        <ToggleStatusDialogContent
          productId={product.id}
          isActive={product.isActive}
        />
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DeleteProductDialogContent productId={product.id} />
      </AlertDialog>
    </>
  );
};

export default ProductTableDropdownMenu;
