"use client";

import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import { ShoppingCartIcon } from "lucide-react";
import { useState } from "react";
import CreateStockEntryDialogContent from "./create-stock-entry-sheet-content";
import { Supplier } from "@prisma/client";
import { IngredientDto } from "@/app/_data-access/ingredient/get-ingredients";

interface RegisterPurchaseButtonProps {
  suppliers: Supplier[];
  products: IngredientDto[];
}

const RegisterPurchaseButton = ({
  suppliers,
  products,
}: RegisterPurchaseButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <ShoppingCartIcon size={20} />
          Registrar compra
        </Button>
      </DialogTrigger>
      <CreateStockEntryDialogContent 
        setSheetIsOpen={setDialogIsOpen} 
        suppliers={suppliers}
        products={products}
      />
    </Dialog>
  );
};

export default RegisterPurchaseButton;
