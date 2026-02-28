"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/_components/ui/dialog";
import { SecurityForm } from "../profile/_components/security-form";
import { ShieldAlertIcon } from "lucide-react";

interface PasswordResetModalProps {
  isOpen: boolean;
}

export const PasswordResetModal = ({ isOpen }: PasswordResetModalProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent
        className="max-w-md [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <ShieldAlertIcon size={24} />
          </div>
          <DialogTitle className="text-2xl font-black">
            Ação Necessária
          </DialogTitle>
          <DialogDescription>
            Sua senha atual é temporária ou expirou. Por motivos de segurança,
            você deve criar uma nova senha para continuar usando o Stocky.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <SecurityForm />
        </div>

        <p className="text-center text-[10px] text-slate-400">
          Esta é uma medida de proteção obrigatória para sua conta.
        </p>
      </DialogContent>
    </Dialog>
  );
};
