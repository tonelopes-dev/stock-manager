"use client";

import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogTrigger } from "@/app/_components/ui/dialog";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import UpsertCustomerDialogContent from "./upsert-dialog-content";

interface AddCustomerButtonProps {
  categories: { id: string; name: string }[];
  stages: { id: string; name: string }[];
}

const AddCustomerButton = ({ categories, stages }: AddCustomerButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 font-bold">
          <PlusIcon size={20} />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <UpsertCustomerDialogContent
        setDialogIsOpen={setDialogIsOpen}
        categories={categories}
        stages={stages}
      />
    </Dialog>
  );
};

export default AddCustomerButton;
