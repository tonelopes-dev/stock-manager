"use client";

import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import { PlusIcon } from "lucide-react";

import { useState } from "react";
import UpsertProductDialogContent from "./upsert-dialog-content";
import { ProductCategoryOption } from "@/app/_data-access/product/get-product-categories";
import { EnvironmentOption } from "@/app/_data-access/product/get-environments";

interface CreateProductButtonProps {
  hasProducts: boolean;
  categories: ProductCategoryOption[];
  environments: EnvironmentOption[];
  overheadSettings: {
    enableOverheadInjection: boolean;
    overheadRate: number;
  } | null;
}

const CreateProductButton = ({
  hasProducts,
  categories,
  environments,
  overheadSettings,
}: CreateProductButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon size={20} />
          Novo produto
        </Button>
      </DialogTrigger>
      <UpsertProductDialogContent
        setDialogIsOpen={setDialogIsOpen}
        hasProducts={hasProducts}
        categories={categories}
        environments={environments}
        overheadSettings={overheadSettings}
      />
    </Dialog>
  );
};

export default CreateProductButton;
