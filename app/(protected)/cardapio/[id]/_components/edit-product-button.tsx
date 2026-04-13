"use client";

import { useState } from "react";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import { EditIcon } from "lucide-react";
import UpsertProductDialogContent from "../../_components/upsert-dialog-content";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";
import { ProductDetailDto } from "@/app/_data-access/product/get-product-by-id";

interface EditProductButtonProps {
  product: ProductDetailDto;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
  overheadSettings: {
    enableOverheadInjection: boolean;
    overheadRate: number;
  } | null;
}

export default function EditProductButton({
  product,
  categories,
  environments,
  overheadSettings,
}: EditProductButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Map ProductDetailDto to UpsertProductSchema format
  const defaultValues = {
    id: product.id,
    name: product.name,
    type: product.type as any,
    price: product.price,
    cost: Number(product.cost),
    operationalCost: Number(product.operationalCost),
    sku: product.sku,
    stock: product.stock,
    minStock: product.minStock,
    unit: product.unit,
    categoryId: (product as any).categoryId, // We might need to ensure this is available in the DTO
    environmentId: (product as any).environmentId,
    trackExpiration: (product as any).trackExpiration || false,
    expirationDate: (product as any).expirationDate ? new Date((product as any).expirationDate) : null,
    imageUrl: (product as any).imageUrl || "",
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <EditIcon size={16} />
          Editar Produto
        </Button>
      </DialogTrigger>
      <UpsertProductDialogContent
        setDialogIsOpen={setIsOpen}
        defaultValues={defaultValues as any}
        categories={categories}
        environments={environments}
        overheadSettings={overheadSettings}
      />
    </Dialog>
  );
}
