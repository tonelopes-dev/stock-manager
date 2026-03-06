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
} from "lucide-react";
import SidebarButton from "./sidebar-button";
import LogoutButton from "./logout-button";
import { useAppMode } from "./app-mode-provider";

interface SidebarNavProps {
  isOwner: boolean;
  isAdminOrOwner: boolean;
}

const gestaoItems = [
  { href: "/dashboard", icon: LayoutGridIcon, label: "Dashboard" },
  { href: "/products", icon: PackageIcon, label: "Produtos" },
  { href: "/ingredients", icon: BeakerIcon, label: "Insumos" },
  { href: "/sales", icon: ShoppingBasketIcon, label: "Vendas" },
  { href: "/customers", icon: UsersIcon, label: "CRM" },
  { href: "/goals", icon: TargetIcon, label: "Metas" },
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
        <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-300">
          {mode === "gestao" ? "Gestão" : "Operação"}
        </p>

        {navItems.map((item) => (
          <SidebarButton key={`${mode}-${item.href}`} href={item.href}>
            <item.icon size={18} />
            {item.label}
          </SidebarButton>
        ))}

        <div className="my-2 border-t border-gray-100" />

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

        {isOwner && (
          <SidebarButton href="/settings/company">
            <SettingsIcon size={18} />
            Empresa
          </SidebarButton>
        )}

        {isAdminOrOwner && (
          <SidebarButton href="/audit">
            <HistoryIcon size={18} />
            Auditoria
          </SidebarButton>
        )}
      </div>

      {/* Logout */}
      <div className="mt-auto p-4">
        <LogoutButton />
      </div>
    </div>
  );
};
