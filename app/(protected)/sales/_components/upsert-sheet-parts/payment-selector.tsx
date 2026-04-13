"use client";

import { Label } from "@/app/_components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { PaymentMethod } from "@prisma/client";
import {
  BanknoteIcon,
  CreditCardIcon,
  SmartphoneIcon,
  WalletIcon,
} from "lucide-react";
import { useFormContext } from "react-hook-form";

interface PaymentSelectorProps {
  isReadOnly?: boolean;
}

export const PaymentSelector = ({ isReadOnly = false }: PaymentSelectorProps) => {
  const { watch, setValue } = useFormContext();
  const paymentMethod = watch("paymentMethod");

  return (
    <div className="mt-3 space-y-1">
      <Label className="text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground">
        Forma de Pagamento
      </Label>
      <Select
        value={paymentMethod || ""}
        onValueChange={(val) => setValue("paymentMethod", val as PaymentMethod)}
      >
        <SelectTrigger
          className="h-12 border-border font-bold focus:ring-primary/20"
          aria-label="Forma de Pagamento"
          data-testid="payment-method-select"
          disabled={isReadOnly}
        >
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent className="border-border">
          <SelectItem value="CASH" className="font-bold text-foreground">
            <div className="flex items-center gap-2">
              <BanknoteIcon size={16} className="text-emerald-500" />
              Dinheiro
            </div>
          </SelectItem>
          <SelectItem value="PIX" className="font-bold text-foreground">
            <div className="flex items-center gap-2">
              <SmartphoneIcon size={16} className="text-cyan-500" />
              PIX
            </div>
          </SelectItem>
          <SelectItem value="CREDIT_CARD" className="font-bold text-foreground">
            <div className="flex items-center gap-2">
              <CreditCardIcon size={16} className="text-primary" />
              Crédito
            </div>
          </SelectItem>
          <SelectItem value="DEBIT_CARD" className="font-bold text-foreground">
            <div className="flex items-center gap-2">
              <WalletIcon size={16} className="text-primary" />
              Débito
            </div>
          </SelectItem>
          <SelectItem value="OTHER" className="font-bold text-foreground">
            <div className="flex items-center gap-2">
              <WalletIcon size={16} className="text-muted-foreground" />
              Outro
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
