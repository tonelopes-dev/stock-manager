"use client";

import { Button } from "@/app/_components/ui/button";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Dialog } from "@/app/_components/ui/dialog";
import { UpsertGoalDialogContent } from "./upsert-goal-dialog-content";

interface CreateGoalButtonProps {
  products: { id: string; name: string }[];
}

export const CreateGoalButton = ({ products }: CreateGoalButtonProps) => {
  const [dialogIsOpen, setDialogIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setDialogIsOpen(true)}
        className="gap-2 font-bold shadow-sm transition-all hover:shadow-md"
      >
        <PlusIcon size={16} />
        Criar Meta
      </Button>

      <Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
        <UpsertGoalDialogContent
          products={products}
          onClose={() => setDialogIsOpen(false)}
        />
      </Dialog>
    </>
  );
};
