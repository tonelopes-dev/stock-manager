"use client";

import { Button } from "@/app/_components/ui/button";
import { CreditCardIcon } from "lucide-react";
import Link from "next/link";

export const BillingActions = () => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
      <Button asChild size="lg" className="gap-2">
        <Link href="/plans">
          <CreditCardIcon className="h-4 w-4" />
          Ver Planos e Pagamento
        </Link>
      </Button>
    </div>
  );
};
