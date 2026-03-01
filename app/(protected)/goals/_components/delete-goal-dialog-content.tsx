"use client";

import { deleteGoal } from "@/app/_actions/goal/delete-goal";
import { Button } from "@/app/_components/ui/button";
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { Loader2Icon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";

interface DeleteGoalDialogContentProps {
  id: string;
  name: string;
  onClose: () => void;
}

export const DeleteGoalDialogContent = ({
  id,
  name,
  onClose,
}: DeleteGoalDialogContentProps) => {
  const { execute: executeDeleteGoal, status } = useAction(deleteGoal, {
    onSuccess: () => {
      toast.success("Meta removida com sucesso.");
      onClose();
    },
    onError: () => {
      toast.error("Ocorreu um erro ao remover a meta.");
    },
  });

  const isPending = status === "executing";

  const handleConfirmDelete = () => {
    executeDeleteGoal({ id });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Excluir Meta</DialogTitle>
        <DialogDescription>
          Você tem certeza que deseja excluir a meta{" "}
          <span className="font-bold text-slate-900">&quot;{name}&quot;</span>?
          Esta ação não pode ser desfeita.
        </DialogDescription>
      </DialogHeader>

      <DialogFooter className="gap-2 sm:gap-0">
        <DialogClose asChild>
          <Button variant="secondary" disabled={isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button
          variant="destructive"
          onClick={handleConfirmDelete}
          disabled={isPending}
          className="gap-1.5"
        >
          {isPending && <Loader2Icon className="animate-spin" size={16} />}
          Excluir Meta
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
