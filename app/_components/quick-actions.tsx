"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/_components/ui/button";
import {
  Plus,
  ShoppingBasket,
  UserPlus,
  ClipboardList,
  BeakerIcon,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/_components/ui/popover";

const actions = [
  {
    label: "Nova Venda",
    icon: <ShoppingBasket className="h-4 w-4" />,
    href: "/sales",
    color: "text-violet-600 bg-violet-50",
  },
  {
    label: "Novo Pedido",
    icon: <ClipboardList className="h-4 w-4" />,
    href: "/kds",
    color: "text-blue-600 bg-blue-50",
  },
  {
    label: "Novo Cliente",
    icon: <UserPlus className="h-4 w-4" />,
    href: "/customers",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    label: "Entrada de Insumo",
    icon: <BeakerIcon className="h-4 w-4" />,
    href: "/ingredients",
    color: "text-amber-600 bg-amber-50",
  },
];

export const QuickActions = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          size="icon"
          className="h-9 w-9 rounded-xl bg-slate-900 text-white shadow-lg shadow-slate-200 transition-all hover:bg-slate-800 hover:shadow-xl active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-52 rounded-2xl border-none p-2 shadow-2xl"
      >
        <div className="space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400">
            Ações Rápidas
          </p>
          {actions.map((action) => (
            <button
              key={action.href}
              onClick={() => {
                setOpen(false);
                router.push(action.href);
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 active:scale-95"
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-xl ${action.color}`}
              >
                {action.icon}
              </div>
              {action.label}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
