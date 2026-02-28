"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/_components/ui/card";
import { Button } from "@/app/_components/ui/button";
import {
  AlertTriangleIcon,
  Trash2Icon,
  UserPlusIcon,
  Loader2Icon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/_components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { Input } from "@/app/_components/ui/input";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { transferOwnership } from "@/app/_actions/company/transfer-ownership";
import { softDeleteCompany } from "@/app/_actions/company/delete-company";

import { signOut } from "next-auth/react";
import { Label } from "@/app/_components/ui/label";

interface AdminUser {
  id: string;
  name: string | null;
  email: string;
}

interface DangerZoneProps {
  companyName: string;
  admins: AdminUser[];
}

export const DangerZone = ({ companyName, admins }: DangerZoneProps) => {
  const [selectedAdminId, setSelectedAdminId] = useState<string>("");
  const [confirmDeleteName, setConfirmDeleteName] = useState("");
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [deleteConfirmed, setDeleteConfirmed] = useState(false);

  const transferAction = useAction(transferOwnership, {
    onSuccess: () => {
      toast.success("Posse transferida com sucesso! Redirecionando...");
      setTransferDialogOpen(false);
      // Force sign out to clear stale session
      signOut({ callbackUrl: "/?reason=ownership_transferred" });
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao transferir posse.");
    },
  });

  const deleteAction = useAction(softDeleteCompany, {
    onSuccess: () => {
      toast.success("Empresa excluída com sucesso.");
      setDeleteDialogOpen(false);
      signOut({ callbackUrl: "/login?reason=company_deleted" });
    },
    onError: (error) => {
      toast.error(error.error.serverError || "Erro ao excluir empresa.");
    },
  });

  const handleTransfer = () => {
    if (!selectedAdminId) return;
    transferAction.execute({ newOwnerId: selectedAdminId });
  };

  const handleDelete = () => {
    if (confirmDeleteName !== companyName) return;
    deleteAction.execute({ confirmationString: confirmDeleteName });
  };

  return (
    <Card className="overflow-hidden border-red-100 bg-red-50/20 shadow-sm">
      <CardHeader className="border-b border-red-100 bg-red-50/50">
        <div className="flex items-center gap-3 text-red-700">
          <AlertTriangleIcon size={20} />
          <CardTitle className="text-lg font-black">Zona de Perigo</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Transfer Ownership */}
        <div className="space-y-3">
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-red-800">
              Transferir Propriedade
            </h4>
            <p className="text-xs text-red-600/80">
              Transfira a conta para um administrador. Você perderá os
              privilégios de proprietário.
            </p>
          </div>

          <Dialog
            open={transferDialogOpen}
            onOpenChange={setTransferDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="h-10 w-full gap-2 border-red-200 text-xs font-bold text-red-700 hover:bg-red-50"
              >
                <UserPlusIcon size={14} />
                Transferir Posse
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Transferir Posse da Empresa</DialogTitle>
                <DialogDescription>
                  Selecione um Administrador para assumir como proprietário.
                  Esta ação é irreversível e você será deslogado para atualizar
                  suas permissões.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-500">
                    Selecionar Novo Proprietário
                  </label>
                  {admins.length > 0 ? (
                    <Select
                      onValueChange={setSelectedAdminId}
                      value={selectedAdminId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Escolha um administrador..." />
                      </SelectTrigger>
                      <SelectContent>
                        {admins.map((admin) => (
                          <SelectItem key={admin.id} value={admin.id}>
                            {admin.name || admin.email} ({admin.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs font-medium italic text-amber-600">
                      Não há outros administradores elegíveis. Promova alguém a
                      Admin primeiro.
                    </p>
                  )}
                </div>

                <div className="flex items-start space-x-3 rounded-lg border border-amber-100/50 bg-amber-50/30 p-4 py-4">
                  <input
                    type="checkbox"
                    id="transfer-confirm"
                    checked={transferConfirmed}
                    onChange={(e) => setTransferConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                  />
                  <Label
                    htmlFor="transfer-confirm"
                    className="cursor-pointer text-xs leading-tight text-amber-800"
                  >
                    Estou ciente que perderei acesso administrativo total e
                    serei deslogado imediatamente.
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setTransferDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  disabled={
                    !selectedAdminId ||
                    !transferConfirmed ||
                    transferAction.isPending
                  }
                  onClick={handleTransfer}
                  className="gap-2"
                >
                  {transferAction.isPending && (
                    <Loader2Icon size={14} className="animate-spin" />
                  )}
                  Confirmar Transferência
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="h-px bg-red-100" />

        {/* Delete Company */}
        <div className="space-y-3">
          <div className="flex flex-col">
            <h4 className="text-sm font-bold text-red-800">Excluir Empresa</h4>
            <p className="text-xs text-red-600/80">
              Apaga permanentemente todos os dados vinculados a este
              CNPJ/Empresa.
            </p>
          </div>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="destructive"
                className="h-10 w-full gap-2 text-xs font-black shadow-sm"
              >
                <Trash2Icon size={14} />
                Excluir Empresa Permanentemente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-700">
                  Atenção Crítica!
                </DialogTitle>
                <DialogDescription>
                  Esta ação é <strong className="uppercase">definitiva</strong>.
                  Todos os produtos, estoques, vendas e usuários serão
                  removidos.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase leading-tight text-slate-500">
                    Digite{" "}
                    <span className="font-black text-red-600">
                      {companyName}
                    </span>{" "}
                    para confirmar
                  </label>
                  <Input
                    placeholder="Nome da empresa..."
                    value={confirmDeleteName}
                    onChange={(e) => setConfirmDeleteName(e.target.value)}
                    className="border-red-200 focus-visible:ring-red-500"
                  />
                </div>

                <div className="flex items-start space-x-3 rounded-lg border border-red-100/50 bg-red-50/50 p-4 py-4">
                  <input
                    type="checkbox"
                    id="delete-confirm"
                    checked={deleteConfirmed}
                    onChange={(e) => setDeleteConfirmed(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
                  />
                  <Label
                    htmlFor="delete-confirm"
                    className="cursor-pointer text-xs leading-tight text-red-800"
                  >
                    Compreendo que esta ação é irreversível e resultará na perda
                    total de dados.
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  Manter Dados
                </Button>
                <Button
                  variant="destructive"
                  disabled={
                    confirmDeleteName !== companyName ||
                    !deleteConfirmed ||
                    deleteAction.isPending
                  }
                  onClick={handleDelete}
                  className="gap-2"
                >
                  {deleteAction.isPending && (
                    <Loader2Icon size={14} className="animate-spin" />
                  )}
                  Confirmar Exclusão Total
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
