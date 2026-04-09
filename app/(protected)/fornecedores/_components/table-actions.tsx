"use client";

import { useState } from "react";
import { Supplier } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import { EditIcon } from "lucide-react";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import UpsertSupplierDialogContent from "./upsert-dialog-content";

interface SupplierTableActionsProps {
  supplier: Supplier;
}

const SupplierTableActions = ({ supplier }: SupplierTableActionsProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <EditIcon size={18} />
        </Button>
      </DialogTrigger>
      <UpsertSupplierDialogContent 
        setDialogIsOpen={setDialogIsOpen} 
        defaultValues={{
          id: supplier.id,
          name: supplier.name,
          contactName: supplier.contactName ?? "",
          email: supplier.email ?? "",
          phone: supplier.phone ?? "",
          taxId: supplier.taxId ?? "",
        }}
      />
    </Dialog>
  );
};

export default SupplierTableActions;
