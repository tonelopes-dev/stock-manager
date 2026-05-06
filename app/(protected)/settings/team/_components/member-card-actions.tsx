"use client";

import { useAction } from "next-safe-action/hooks";
import { removeMember } from "@/app/_actions/user/remove-member";
import { UserRole } from "@prisma/client";
import { Button } from "@/app/_components/ui/button";
import { Trash2Icon, Loader2Icon, Edit3Icon } from "lucide-react";
import MemberFormModal from "./member-form-modal";

import { toast } from "sonner";
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
import { useState } from "react";

interface MemberCardActionsProps {
  member: {
    id: string; // UserCompany ID
    name: string | null;
    email: string;
    role: UserRole;
    permissions: string[];
    avatarUrl?: string | null;
    userId: string;
  };
  requesterRole: UserRole;
  isSelf: boolean;
}

export const MemberCardActions = ({ member, requesterRole, isSelf }: MemberCardActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const removeAction = useAction(removeMember, {
    onSuccess: () => { toast.success("Membro removido com sucesso."); },
    onError: (e) => { toast.error(e.error.serverError || "Erro ao remover membro."); },
  });

  const canRemove = !isSelf && (
    requesterRole === UserRole.OWNER || 
    (requesterRole === UserRole.ADMIN && member.role === UserRole.MEMBER)
  );

  const canEdit = !isSelf && (
    requesterRole === UserRole.OWNER || 
    (requesterRole === UserRole.ADMIN && member.role === UserRole.MEMBER)
  );

  if (!canRemove && !canEdit) return null;

  return (
    <div className="flex items-center gap-1">
      {canEdit && (
        <MemberFormModal 
            mode="edit"
            initialData={{
                userCompanyId: member.id,
                name: member.name,
                email: member.email,
                role: member.role,
                permissions: member.permissions,
                avatarUrl: member.avatarUrl ?? undefined
            }}
            trigger={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                    <Edit3Icon size={16} />
                </Button>
            }
        />
      )}

      {canRemove && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
              <Trash2Icon size={16} />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover Membro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação removerá o acesso do usuário à empresa imediatamente. 
                Os registros realizados por ele não serão excluídos.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => removeAction.execute({ userCompanyId: member.id })}
                className="bg-destructive hover:bg-destructive"
              >
                {removeAction.isPending ? <Loader2Icon className="animate-spin" /> : "Confirmar Remoção"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};
