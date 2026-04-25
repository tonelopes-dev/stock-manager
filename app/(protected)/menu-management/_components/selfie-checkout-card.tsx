"use client";

import { useState } from "react";
import { User, Loader2 } from "lucide-react";
import { Switch } from "@/app/_components/ui/switch";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { toggleSelfieRequirement } from "@/app/_actions/company/toggle-selfie-requirement";

interface SelfieCheckoutCardProps {
  companyId: string;
  initialValue: boolean;
}

export function SelfieCheckoutCard({ companyId, initialValue }: SelfieCheckoutCardProps) {
  const [enabled, setEnabled] = useState(initialValue);

  const { execute, isPending } = useAction(toggleSelfieRequirement, {
    onSuccess: () => {
      toast.success("Configuração atualizada!");
    },
    onError: () => {
      setEnabled(!enabled);
      toast.error("Erro ao salvar configuração.");
    }
  });

  const handleToggle = (checked: boolean) => {
    setEnabled(checked);
    execute({ enabled: checked });
  };

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm flex flex-col justify-between h-full">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <User className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-black text-foreground uppercase tracking-tight">
            Checkout Seguro
          </h3>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
            Identificação por Selfie
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-900 leading-none">Obrigar Selfie</span>
              <p className="text-[10px] text-muted-foreground leading-tight mt-1">
                Solicita uma foto em tempo real do cliente antes de finalizar o pedido.
              </p>
            </div>
            <div className="relative">
              {isPending && (
                <div className="absolute -left-6 top-1">
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                </div>
              )}
              <Switch
                checked={enabled}
                onCheckedChange={handleToggle}
                disabled={isPending}
              />
            </div>
          </div>
        </div>
        
        <p className="text-[9px] text-slate-400 italic px-1">
          * Aumenta a segurança e facilita a identificação visual no salão ou na entrega.
        </p>
      </div>
    </div>
  );
}
