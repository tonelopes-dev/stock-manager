"use client";

import { useAction } from "next-safe-action/hooks";
import { removeMember } from "@/app/_actions/user/remove-member";
import { updateMemberRole } from "@/app/_actions/user/update-member-role";
import { UserRole } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import { Button } from "@/app/_components/ui/button";
import { Trash2Icon, ShieldIcon, UserIcon, Loader2Icon } from "lucide-react";

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
  memberId: string;
  memberRole: UserRole;
  requesterRole: UserRole;
  isSelf: boolean;
}

export const MemberCardActions = ({ memberId, memberRole, requesterRole, isSelf }: MemberCardActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const removeAction = useAction(removeMember, {
    onSuccess: () => { toast.success("Membro removido com sucesso."); },
    onError: (e) => { toast.error(e.error.serverError || "Erro ao remover membro."); },
  });

  const updateRoleAction = useAction(updateMemberRole, {
    onSuccess: () => { toast.success("Papel atualizado com sucesso."); },
    onError: (e) => { toast.error(e.error.serverError || "Erro ao atualizar papel."); },
  });


  const canRemove = !isSelf && (
    requesterRole === UserRole.OWNER || 
    (requesterRole === UserRole.ADMIN && memberRole === UserRole.MEMBER)
  );

  const canChangeRole = requesterRole === UserRole.OWNER && !isSelf;

  if (!canRemove && !canChangeRole) return null;

  return (
    <div className="flex items-center gap-2">
      {canChangeRole && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary">
              <ShieldIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Alterar Papel</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
               onClick={() => updateRoleAction.execute({ userCompanyId: memberId, newRole: UserRole.MEMBER })}
               className="gap-2"
               disabled={memberRole === UserRole.MEMBER || updateRoleAction.isPending}
            >
              <UserIcon size={14} /> Membro (Operação)
            </DropdownMenuItem>
            <DropdownMenuItem 
               onClick={() => updateRoleAction.execute({ userCompanyId: memberId, newRole: UserRole.ADMIN })}
               className="gap-2"
               disabled={memberRole === UserRole.ADMIN || updateRoleAction.isPending}
            >
              <ShieldIcon size={14} /> Administrador
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {canRemove && (
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600">
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
                onClick={() => removeAction.execute({ userCompanyId: memberId })}
                className="bg-red-600 hover:bg-red-700"
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
