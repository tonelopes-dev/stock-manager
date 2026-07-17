import { LucideIcon } from "lucide-react";
import {
  CreditCardIcon,
  LayoutGridIcon,
  ShoppingBasketIcon,
  UsersIcon,
  HistoryIcon,
  SettingsIcon,
  TargetIcon,
  QrCode,
  Truck,
  Utensils,
  Boxes,
  Monitor,
  PlugIcon,
} from "lucide-react";
import { PERMISSIONS } from "@/app/_lib/permissions";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  mode?: "gestao" | "operacao" | "both";
  requiredCapability?: string;
  isSensitive?: boolean;
}

export const NAVIGATION_ITEMS: NavItem[] = [
  // App Core (Gestão e Operação)
  { href: "/sales", icon: ShoppingBasketIcon, label: "PDV / Vendas", mode: "both" },
  { href: "/customers", icon: UsersIcon, label: "CRM", mode: "gestao" },
  { href: "/kds", icon: Monitor, label: "Monitores", mode: "operacao" },
  { href: "/menu-management", icon: QrCode, label: "Cardápio Digital", mode: "operacao" },
  { href: "/cardapio", icon: Utensils, label: "Cardápio", mode: "both" },
  { href: "/estoque", icon: Boxes, label: "Estoque", mode: "gestao" },
  { href: "/fornecedores", icon: Truck, label: "Fornecedores", mode: "gestao" },
  { href: "/goals", icon: TargetIcon, label: "Metas", mode: "gestao" },
  { href: "/dashboard", icon: LayoutGridIcon, label: "Dashboard", mode: "gestao" },
  
  // Configurações e Áreas Sensíveis (Geralmente no Rodapé)
  { 
    href: "/settings/team", 
    icon: UsersIcon, 
    label: "Equipe", 
    requiredCapability: PERMISSIONS.TEAM_MANAGE,
    isSensitive: true
  },
  { 
    href: "/plans", 
    icon: CreditCardIcon, 
    label: "Assinatura", 
    requiredCapability: PERMISSIONS.BILLING_VIEW,
    isSensitive: true
  },
  { 
    href: "/audit", 
    icon: HistoryIcon, 
    label: "Auditoria", 
    requiredCapability: PERMISSIONS.AUDIT_VIEW,
    isSensitive: true
  },
  { 
    href: "/integracoes", 
    icon: PlugIcon, 
    label: "Integrações", 
    requiredCapability: PERMISSIONS.INTEGRATIONS_VIEW,
    isSensitive: true
  },
  { 
    href: "/settings/company", 
    icon: SettingsIcon, 
    label: "Empresa", 
    requiredCapability: PERMISSIONS.SETTINGS_VIEW,
    isSensitive: true
  },
];
