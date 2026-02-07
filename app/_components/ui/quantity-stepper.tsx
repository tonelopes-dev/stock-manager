"use client";

import { Button } from "./button";
import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@/app/_lib/utils";

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  min?: number;
  className?: string;
}

export function QuantityStepper({ 
  value, 
  onChange, 
  max, 
  min = 1,
  className 
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (max === undefined || value < max) {
      onChange(value + 1);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        variant="outline"
        size="icon"
        type="button"
        className="h-8 w-8 rounded-lg border-slate-200"
        onClick={handleDecrement}
        disabled={value <= min}
      >
        <MinusIcon size={14} className="text-slate-600" />
      </Button>
      <span className="w-8 text-center text-sm font-bold text-slate-900">
        {value}
      </span>
      <Button
        variant="outline"
        size="icon"
        type="button"
        className="h-8 w-8 rounded-lg border-slate-200"
        onClick={handleIncrement}
        disabled={max !== undefined && value >= max}
      >
        <PlusIcon size={14} className="text-slate-600" />
      </Button>
    </div>
  );
}
