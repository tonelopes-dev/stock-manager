"use client";

import { useAppMode, AppMode } from "./app-mode-provider";
import { LayoutGrid, UtensilsCrossed } from "lucide-react";

const modes: { value: AppMode; label: string; icon: React.ReactNode }[] = [
  {
    value: "gestao",
    label: "Gestão",
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
  },
  {
    value: "operacao",
    label: "Operação",
    icon: <UtensilsCrossed className="h-3.5 w-3.5" />,
  },
];

export const ContextSwitcher = () => {
  const { mode, setMode } = useAppMode();

  return (
    <div className="flex items-center rounded-xl bg-muted p-0.5">
      {modes.map((m) => (
        <button
          key={m.value}
          onClick={() => setMode(m.value)}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all duration-200 cursor-pointer ${
            mode === m.value
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          {m.icon}
          {m.label}
        </button>
      ))}
    </div>
  );
};
