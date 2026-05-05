"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Button } from "@/app/_components/ui/button";
import { DatePicker } from "@/app/_components/ui/date-picker";
import { User, Phone, Mail, Calendar, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";

interface IdentificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: "PHONE" | "DETAILS";
  setStep: (step: "PHONE" | "DETAILS") => void;
  form: {
    phoneNumber: string;
    name: string;
    email: string;
    birthDate: string;
  };
  setForm: (form: any) => void;
  isIdentifying: boolean;
  onIdentify: () => void;
}

export function IdentificationDialog({
  open,
  onOpenChange,
  step,
  setStep,
  form,
  setForm,
  isIdentifying,
  onIdentify,
}: IdentificationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) setStep("PHONE");
      }}
    >
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black tracking-tight">
            <User className="h-5 w-5 text-primary" />
            {step === "PHONE" ? "Identificação" : "Complete seu cadastro"}
          </DialogTitle>
          <DialogDescription>
            {step === "PHONE"
              ? "Informe seu telefone para continuar."
              : "Parece que é sua primeira vez aqui! Conte-nos quem você é."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === "PHONE" ? (
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Phone className="h-3 w-3" />
                Telefone *
              </label>
              <Input
                placeholder="(11) 99999-9999"
                value={form.phoneNumber}
                onChange={(e) =>
                  setForm({ ...form, phoneNumber: e.target.value })
                }
                className="rounded-xl text-base md:text-sm"
                type="tel"
                autoFocus
                data-testid="identify-phone-input"
              />
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <User className="h-3 w-3" />
                  Nome *
                </label>
                <Input
                  placeholder="Seu nome completo"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="rounded-xl text-base md:text-sm"
                  autoFocus
                  data-testid="identify-name-input"
                />
              </div>

              <div className="space-y-1.5 opacity-60">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Phone className="h-3 w-3" />
                  Telefone
                </label>
                <Input value={form.phoneNumber} disabled className="rounded-xl bg-muted" />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  Email <span className="text-muted-foreground">(opcional)</span>
                </label>
                <Input
                  placeholder="seu@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="rounded-xl text-base md:text-sm"
                  type="email"
                />
              </div>

              <div className="space-y-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  Data de nascimento <span className="text-muted-foreground">(opcional)</span>
                </label>
                <DatePicker
                  value={form.birthDate ? parseISO(form.birthDate) : undefined}
                  onChange={(date: Date | undefined) =>
                    setForm({
                      ...form,
                      birthDate: date ? format(date, "yyyy-MM-dd") : "",
                    })
                  }
                  showDropdowns={true}
                  className="rounded-xl"
                />
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="h-14 w-full rounded-2xl bg-foreground text-base font-black text-background shadow-xl transition-all hover:bg-foreground disabled:opacity-50"
            disabled={
              isIdentifying ||
              (step === "PHONE" && !form.phoneNumber) ||
              (step === "DETAILS" && (!form.name || !form.phoneNumber))
            }
            onClick={onIdentify}
            data-testid="identify-submit-button"
          >
            {isIdentifying ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                VERIFICANDO...
              </div>
            ) : step === "PHONE" ? (
              "CONTINUAR"
            ) : (
              "CONFIRMAR E ENVIAR PEDIDO"
            )}
          </Button>

          {step === "DETAILS" && (
            <button
              onClick={() => setStep("PHONE")}
              className="mt-2 text-center text-xs font-bold text-muted-foreground hover:text-muted-foreground"
            >
              Voltar e alterar telefone
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
