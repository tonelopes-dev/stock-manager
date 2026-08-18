"use client";

import { deleteInvitation } from "@/app/_actions/user/delete-invitation";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/app/_components/ui/alert-dialog";
import { Button } from "@/app/_components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/app/_components/ui/dropdown-menu";
import { CopyIcon, Loader2Icon, MoreHorizontalIcon, TrashIcon } from "lucide-react";
import { useAction } from "next-safe-action/hooks";
import { useState } from "react";
import { toast } from "sonner";

interface PendingInviteActionsProps {
  inviteId: string;
  token: string;
  email: string;
}

export function PendingInviteActions({ inviteId, token, email }: PendingInviteActionsProps) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const deleteAction = useAction(deleteInvitation, {
    onSuccess: () => {
      toast.success("Convite cancelado com sucesso.");
      setIsAlertOpen(false);
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao cancelar convite.");
      setIsAlertOpen(false);
    }
  });

  const handleCopyLink = () => {
    const link = `${window.location.origin}/invite/accept?token=${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copiado para a área de transferência.");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
            <MoreHorizontalIcon size={16} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer gap-2 font-medium">
            <CopyIcon size={14} />
            Copiar Link Mágico
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setIsAlertOpen(true)} 
            className="cursor-pointer gap-2 text-destructive focus:text-destructive focus:bg-destructive/10 font-bold"
          >
            <TrashIcon size={14} />
            Cancelar Convite
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Convite?</AlertDialogTitle>
            <AlertDialogDescription>
              O convite enviado para <strong className="text-foreground">{email}</strong> será invalidado. O link mágico atual deixará de funcionar imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteAction.isPending}>Voltar</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteAction.isPending}
              onClick={() => deleteAction.execute({ id: inviteId })}
              className="gap-2 font-bold"
            >
              {deleteAction.isPending ? <Loader2Icon size={16} className="animate-spin" /> : <TrashIcon size={16} />}
              Sim, Cancelar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
