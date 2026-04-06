"use client";
import { deleteSale } from "@/app/_actions/sale/delete-sale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Sheet, SheetTrigger } from "@/app/_components/ui/sheet";
import {
  MoreHorizontalIcon,
  ClipboardCopyIcon,
  EditIcon,
  TrashIcon,
} from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import UpsertSheetContent from "./upsert-sheet-content";
import { useState } from "react";
import { ComboboxOption } from "@/app/_components/ui/combobox";
import { ProductDto } from "@/app/_data-access/product/get-products";
import { SaleDto } from "@/app/_data-access/sale/get-sales";

import { UserRole } from "@prisma/client";

interface SalesTableDropdownMenuProps {
  sale: Pick<
    SaleDto,
    "id" | "saleItems" | "date" | "customerId" | "paymentMethod" | "tipAmount" | "discountAmount" | "extraAmount" | "adjustmentReason" | "isEmployeeSale"
  >;
  productOptions: ComboboxOption[];
  customerOptions: ComboboxOption[];
  products: ProductDto[];
  userRole: UserRole;
  companyId: string;
}

const SalesTableDropdownMenu = ({
  sale,
  products,
  productOptions,
  customerOptions,
  userRole,
  companyId,
}: SalesTableDropdownMenuProps) => {
  const [upsertSheetIsOpen, setUpsertSheetIsOpen] = useState(false);
  const { execute } = useAction(deleteSale, {
    onSuccess: () => {
      toast.success("Venda deletada com sucesso.");
    },
    onError: () => {
      toast.error("Erro ao deletar a venda.");
    },
  });
  const handleCopyToClipboardClick = () => {
    navigator.clipboard.writeText(sale.id);
    toast.success("ID copiado para a área de transferência.");
  };
  const handleConfirmDeleteClick = () => execute({ id: sale.id });
  return (
    <Sheet open={upsertSheetIsOpen} onOpenChange={setUpsertSheetIsOpen}>
      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <MoreHorizontalIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-1.5"
              onClick={handleCopyToClipboardClick}
            >
              <ClipboardCopyIcon size={16} />
              Copiar ID
            </DropdownMenuItem>
            {userRole !== UserRole.MEMBER && (
              <>
                <SheetTrigger asChild>
                  <DropdownMenuItem className="gap-1.5">
                    <EditIcon size={16} />
                    Editar
                  </DropdownMenuItem>
                </SheetTrigger>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem className="gap-1.5">
                    <TrashIcon size={16} />
                    Deletar
                  </DropdownMenuItem>
                </AlertDialogTrigger>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir esta venda. Esta ação não pode ser
              desfeita. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteClick}>
              Continuar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <UpsertSheetContent
        setSheetIsOpen={setUpsertSheetIsOpen}
        isOpen={upsertSheetIsOpen}
        saleId={sale.id}
        saleDate={sale.date}
        customerId={sale.customerId}
        paymentMethod={sale.paymentMethod}
        tipAmount={Number(sale.tipAmount)}
        products={products}
        productOptions={productOptions}
        customerOptions={customerOptions}
        defaultDiscountAmount={Number(sale.discountAmount || 0)}
        defaultExtraAmount={Number(sale.extraAmount || 0)}
        defaultAdjustmentReason={sale.adjustmentReason || ""}
        defaultIsEmployeeSale={sale.isEmployeeSale || false}
        companyId={companyId}
        defaultSelectedProducts={sale.saleItems.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            id: item.productId,
            quantity: Number(item.quantity),
            name: item.product.name,
            price: Number(item.unitPrice),
            cost: Number(item.baseCost || 0),
            operationalCost: Number(item.operationalCost || 0),
            stock: product?.stock ?? 0,
          };
        })}
      />
    </Sheet>
  );
};

export default SalesTableDropdownMenu;
