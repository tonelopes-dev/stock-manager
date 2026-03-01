"use client";

import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import UpsertCustomerDialogContent from "./upsert-dialog-content";

const AddCustomerButton = () => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5 font-bold">
          <PlusIcon size={18} />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <UpsertCustomerDialogContent setDialogIsOpen={setDialogIsOpen} />
    </Dialog>
  );
};

export default AddCustomerButton;
