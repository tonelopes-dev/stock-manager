"use client";

import SidebarButton from "./sidebar-button";
import LogoutButton from "./logout-button";
import { useAppMode } from "@/app/_providers/app-mode-provider";
import { hasCapability } from "@/app/_lib/permissions";
import { UserRole } from "@prisma/client";
import { NAVIGATION_ITEMS } from "@/app/_config/navigation";

interface SidebarNavProps {
  role: UserRole;
  permissions: string[];
}

export const SidebarNav = ({ role, permissions }: SidebarNavProps) => {
  const { mode } = useAppMode();

  // Filtragem dinâmica dos itens core baseada no AppMode e RBAC
  const coreItems = NAVIGATION_ITEMS.filter((item) => {
    if (item.isSensitive) return false;
    
    const matchMode = item.mode === "both" || item.mode === mode;
    if (!matchMode) return false;
    
    if (item.requiredCapability && !hasCapability(permissions, role, item.requiredCapability)) {
      return false;
    }
    
    return true;
  });

  // Filtragem dinâmica dos itens sensíveis baseada no RBAC
  const sensitiveItems = NAVIGATION_ITEMS.filter((item) => {
    if (!item.isSensitive) return false;
    
    if (item.requiredCapability && !hasCapability(permissions, role, item.requiredCapability)) {
      return false;
    }
    
    return true;
  });

  return (
    <div className="flex h-full flex-col">
      {/* Navigation Core */}
      <div className="flex flex-1 flex-col gap-1 p-4 pt-4">
        <p className="mb-2 w-0 overflow-hidden px-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-0 transition-all duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100">
          {mode === "gestao" ? "Gestão" : "Operação"}
        </p>

        {coreItems.map((item) => (
          <SidebarButton key={`core-${item.href}`} href={item.href}>
            <item.icon size={18} className="shrink-0" />
            <span className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100">
              {item.label}
            </span>
          </SidebarButton>
        ))}
      </div>

      {sensitiveItems.length > 0 && (
        <div className="my-2 border-t border-border" />
      )}

      {/* Sensitive Links (Rodapé) */}
      <div className="flex flex-col gap-1 px-4">
        {sensitiveItems.map((item) => (
          <SidebarButton key={`sensitive-${item.href}`} href={item.href}>
            <item.icon size={18} className="shrink-0" />
            <span className="w-0 overflow-hidden opacity-0 transition-all duration-300 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100">
              {item.label}
            </span>
          </SidebarButton>
        ))}
      </div>

      {/* Logout */}
      <div className="mt-auto p-4">
        <LogoutButton />
      </div>
    </div>
  );
};
