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
  PlugIcon,
} from "lucide-react";
import SidebarButton from "./sidebar-button";
import LogoutButton from "./logout-button";
import { useAppMode } from "./app-mode-provider";

interface SidebarNavProps {
  isOwner: boolean;
  isAdminOrOwner: boolean;
}

const gestaoItems = [
  { href: "/sales", icon: ShoppingBasketIcon, label: "Vendas" },
  { href: "/customers", icon: UsersIcon, label: "CRM" },
  { href: "/products", icon: PackageIcon, label: "Produtos" },
  { href: "/ingredients", icon: BeakerIcon, label: "Insumos" },
  { href: "/goals", icon: TargetIcon, label: "Metas" },
  { href: "/dashboard", icon: LayoutGridIcon, label: "Dashboard" },
];

const operacaoItems = [
  { href: "/sales", icon: ShoppingBasketIcon, label: "PDV / Vendas" },
  { href: "/kds", icon: ChefHat, label: "Monitor Cozinha" },
  { href: "/menu-management", icon: QrCode, label: "Cardápio Digital" },
  { href: "/products", icon: PackageIcon, label: "Produtos" },
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
      {isAdminOrOwner && (
        <SidebarButton href="/settings/integrations">
          <PlugIcon size={18} />
          Integrações
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
