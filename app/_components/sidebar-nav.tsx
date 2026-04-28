"use client";

import {
  BeakerIcon,
  CreditCardIcon,
  LayoutGridIcon,
  PackageIcon,
  ShoppingBasketIcon,
  UsersIcon,
  HistoryIcon,
  SettingsIcon,
  TargetIcon,
  ChefHat,
  QrCode,
  Truck,
  Utensils,
  Boxes,
} from "lucide-react";
import SidebarButton from "./sidebar-button";
import LogoutButton from "./logout-button";
import { useAppMode } from "@/app/_components/app-mode-provider";

interface SidebarNavProps {
  isOwner: boolean;
  isAdminOrOwner: boolean;
}

const gestaoItems = [
  { href: "/sales", icon: ShoppingBasketIcon, label: "Vendas" },
  { href: "/customers", icon: UsersIcon, label: "CRM" },
  { href: "/cardapio", icon: Utensils, label: "Cardápio" },
  { href: "/estoque", icon: Boxes, label: "Estoque" },
  { href: "/fornecedores", icon: Truck, label: "Fornecedores" },
  { href: "/goals", icon: TargetIcon, label: "Metas" },
  { href: "/dashboard", icon: LayoutGridIcon, label: "Dashboard" },
];

const operacaoItems = [
  { href: "/sales", icon: ShoppingBasketIcon, label: "PDV / Vendas" },
  { href: "/kds", icon: ChefHat, label: "Monitor Cozinha" },
  { href: "/menu-management", icon: QrCode, label: "Cardápio Digital" },
  { href: "/cardapio", icon: Utensils, label: "Cardápio" },
];

export const SidebarNav = ({ isOwner, isAdminOrOwner }: SidebarNavProps) => {
  const { mode } = useAppMode();

  const navItems = mode === "gestao" ? gestaoItems : operacaoItems;

  return (
    <div className="flex h-full flex-col">
      {/* Navigation */}
      <div className="flex flex-1 flex-col gap-1 p-4 pt-4">
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          {mode === "gestao" ? "Gestão" : "Operação"}
        </p>

        {navItems.map((item) => (
          <SidebarButton key={`${mode}-${item.href}`} href={item.href}>
            <item.icon size={18} />
            {item.label}
          </SidebarButton>
        ))}
      </div>

      <div className="my-2 border-t border-border" />

      {/* Settings (always visible) */}
      {isAdminOrOwner && (
        <SidebarButton href="/settings/team">
          <UsersIcon size={18} />
          Equipe
        </SidebarButton>
      )}

      {isOwner && (
        <SidebarButton href="/plans">
          <CreditCardIcon size={18} />
          Assinatura
        </SidebarButton>
      )}

      {isAdminOrOwner && (
        <SidebarButton href="/audit">
          <HistoryIcon size={18} />
          Auditoria
        </SidebarButton>
      )}
      {isOwner && (
        <SidebarButton href="/settings/company">
          <SettingsIcon size={18} />
          Empresa
        </SidebarButton>
      )}

      {/* Logout */}
      <div className="mt-auto p-4">
        <LogoutButton />
      </div>
    </div>
  );
};
