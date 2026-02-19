"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/_components/ui/alert-dialog";
import { Label } from "@/app/_components/ui/label";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/app/_components/ui/button";

interface ConfirmDoubleActionProps {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmationLabel: string;
  onConfirm: () => void;
  isLoading?: boolean;
  variant?: "destructive" | "default";
}

export function ConfirmDoubleAction({
  trigger,
  title,
  description,
  confirmationLabel,
  onConfirm,
  isLoading,
  variant = "default",
}: ConfirmDoubleActionProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent className="sm:max-w-[425px]">
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-amber-600 mb-2">
            <AlertTriangleIcon size={20} />
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm leading-relaxed text-slate-500">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-start space-x-3 py-4 bg-slate-50/50 p-4 rounded-lg border border-slate-100">
          <input 
            type="checkbox"
            id="double-confirmation-checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-1 h-4 w-4 border-slate-300 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
          <Label 
            htmlFor="double-confirmation-checkbox" 
            className="text-xs font-medium leading-normal text-slate-600 cursor-pointer"
          >
            {confirmationLabel}
          </Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setOpen(false);
            setConfirmed(false);
          }}>
            Cancelar
          </AlertDialogCancel>
          <Button
            variant={variant}
            disabled={!confirmed || isLoading}
            onClick={() => {
              onConfirm();
            }}
          >
            {isLoading ? "Processando..." : "Confirmar Ação"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
